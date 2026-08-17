---
title: "Anemic Models - parte 2"
description: "Las recetas finales del capítulo de anemic models: evitar propiedades automáticas, eliminar DTOs, completar constructores vacíos, eliminar getters, eliminar doble encapsulación, prevenir object orgy"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [clean-code, anemic-models, refactoring, oop, encapsulation, ddd]
---

# Anemic Models - parte 2

> [!abstract] Resumen
> Esta nota cubre las recetas 3.6 a 3.11 del libro: cómo deshacerse de los elementos que crean anemicidad una vez que se entiende el problema. Evitar propiedades automáticas, eliminar DTOs, completar constructores vacíos, eliminar getters, doble encapsulación y object orgy. La limpieza final de los objetos anémicos.

## Receta 3.6: Evitar propiedades automáticas

### Problema

Tu lenguaje o framework auto-genera getters y setters para todas las propiedades.

```python
# Java con Lombok
@Data
public class Customer {
    private String name;
    private String email;
    private LocalDate birthDate;
}
# Lombok genera: getName, setName, getEmail, setEmail, ...
```

### Solución

Genera getters solo donde los necesitas. Para el resto, **escribe el código a mano**.

```java
// Manual
public class Customer {
    private String name;
    private String email;
    private LocalDate birthDate;
    
    public String getName() {
        return name;
    }
    
    // No setName. El nombre es esencial.
    // No getEmail. El email es interno.
    
    public void updateEmail(String newEmail) {
        if (isValidEmail(newEmail)) {
            this.email = newEmail;
        }
    }
    
    private boolean isValidEmail(String email) {
        return email != null && email.contains("@");
    }
}
```

### Discusión

El libro señala: los frameworks que auto-generan getters y setters **educan mal** a los programadores. Aprenden que el código "natural" es data + getters + setters, que es el patrón anémico.

> [!tip> El libro es pragmático
> Reconoce que a veces los generadores son útiles (DTOs, serializadores). Pero los objetos de dominio deben tener **métodos con semántica**, no getters automáticos.

## Receta 3.7: Eliminar DTOs

### Problema

Usas **Data Transfer Objects** (DTOs) para mover datos entre capas. Los DTOs son objetos anémicos glorificados.

```java
// DTO clásico
public class CustomerDTO {
    private String name;
    private String email;
    private String phone;
    
    // getters, setters, constructor, equals, hashCode, toString
    // (todo generado)
}
```

### Solución

Usa el **objeto de dominio directamente**. Mueve datos entre capas con el modelo, no con un duplicado.

```java
// Sin DTO
public class Customer {
    private String name;
    private String email;
    private String phone;
    
    public Customer(String name, String email, String phone) {
        this.name = name;
        this.email = email;
        this.phone = phone;
    }
    
    public void updateEmail(String newEmail) { /* ... */ }
    public void addPhone(String newPhone) { /* ... */ }
}
```

### Discusión

El libro es claro: **los DTOs son la exportación del problema anémico**. Tienes un objeto con comportamiento, pero en lugar de pasarlo entre capas, duplicas su estado en un DTO.

```text
El flujo con DTOs:

  Capa de negocio: Customer (rich)
  Capa de presentación: CustomerDTO (anemic)
  Capa de persistencia: CustomerEntity (anemic)

  → 3 clases para un concepto.
  → Lógica duplicada.
  → Sincronización manual.
```

> [!danger> DTOs violan DRY
> Cada DTO duplica el estado del objeto. Sincronizar los tres es trabajo extra. El libro es claro: en muchos casos, **el costo del DTO supera al beneficio**.

### Cuándo SÍ necesitas DTOs

El libro es pragmático:

```text
DTOs legítimos:

  - Comunicación con APIs externas (gRPC, REST).
  - Serialización para transporte (JSON, XML).
  - Versionado de API.
  - Compatibilidad con clientes antiguos.

En estos casos, el DTO es una **vista** del objeto, no un sustituto.
```

> [!tip> DTOs deben ser transient
> Si el DTO es de larga vida, vive en el sistema, y todos los datos los copian a mano, es un smell. Si el DTO es transient, solo para mover datos entre puntos, es legítimo.

## Receta 3.8: Completar constructores vacíos

### Problema

Tu framework requiere un constructor vacío para crear instancias.

```java
// JPA
@Entity
public class Customer {
    private String name;
    private String email;
    
    public Customer() {
        // Constructor vacío para JPA
    }
    
    public Customer(String name, String email) {
        this.name = name;
        this.email = email;
    }
}
```

### Solución

Usa **constructores completos** y **`required`** en el ORM cuando hay restricciones.

```java
// Alternativa 1: required en JPA
@Entity
public class Customer {
    private String name;
    private String email;
    
    public Customer(String name, String email) {
        this.name = name;
        this.email = email;
    }
}

// Alternativa 2: factory pattern
public class CustomerFactory {
    public Customer create(String name, String email) {
        return new Customer(name, email);
    }
}
```

### Discusión

El libro señala que el **constructor vacío** es a menudo una herencia de los frameworks. JPA, JAXB, Gson, todos piden constructor vacío por defecto.

```text
Mal:

  - Constructor vacío + setters.
  - El ORM "rellena" los campos.
  - El objeto existe en estado inválido temporalmente.

Bien:

  - Constructor con argumentos obligatorios.
  - El ORM usa reflection para settear.
  - El objeto nunca está en estado inválido.
```

> [!tip> El estado inválido es insalvable
> El libro es claro: un objeto que existe en estado inválido temporalmente es una bomba de relojería. Mejor asegurar que el objeto **nunca** está en estado inválido.

## Receta 3.9: Eliminar getters

### Problema

Tienes getters para todo. El código es un libro abierto de datos.

```java
public class Customer {
    private String name;
    private String email;
    
    public String getName() { return name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
```

### Solución

Los getters **violan encapsulación**. Elimínalos para los datos que no deben ser consultados externamente.

```java
public class Customer {
    private String name;
    private String email;
    
    public Customer(String name, String email) {
        this.name = name;
        this.email = email;
    }
    
    // No hay getters.
    // El objeto expone comportamiento, no datos.
    
    public String getEmailForInvoice() {
        // Comportamiento específico, no accessor genérico.
        return email;
    }
}
```

### Discusión

El libro recoge la postura de varios autores:

```text
Allen Holub:
  "Getters are evil. They expose data and break encapsulation."

Martin Fowler:
  "Tell, don't ask. The object should do things, not expose data."

Robert C. Martin:
  "Getter methods are a smell. The object should do things, not be a data record."
```

> [!note> No todos los getters son malos
> El libro es claro: getters para **datos que el objeto expone intencionalmente** (como un nombre para mostrar) son legítimos. El problema es hacer getters para **todo**.

```text
Getter legítimo:

  - "Mi nombre es X" → expone name intencionalmente.
  - Necesario para UI, reportes, logs.

Getter ilegítimo:

  - "Mi colección interna es X" → expone estado interno.
  - Permite a otros objetos manipular mi estado.
  - Genera acoplamiento.
```

## Receta 3.10: Eliminar doble encapsulación

### Problema

Tienes un objeto con un campo, y ese campo es otro objeto que tú también encapsulas.

```java
public class Customer {
    private Address address;
    
    public Address getAddress() {
        return address;
    }
    
    public void setAddress(Address address) {
        this.address = address;
    }
}

public class Address {
    private String street;
    private String city;
    
    public String getStreet() { return street; }
    public void setStreet(String street) { this.street = street; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
}
```

### Solución

El Customer no expone Address. Customer expone **comportamiento que implica Address**.

```java
public class Customer {
    private Address address;
    
    public Customer(Address address) {
        this.address = address;
    }
    
    // Comportamiento, no acceso
    public void moveTo(String newCity, String newStreet) {
        this.address.changeTo(newCity, newStreet);
    }
    
    public String getAddressAsString() {
        return address.toString();
    }
}

public class Address {
    private String street;
    private String city;
    
    public Address(String city, String street) {
        this.city = city;
        this.street = street;
    }
    
    public void changeTo(String newCity, String newStreet) {
        this.city = newCity;
        this.street = newStreet;
    }
    
    @Override
    public String toString() {
        return city + ", " + street;
    }
}
```

### Discusión

El libro es claro: la doble encapsulación es **común en ORM mal diseñados** y en APIs que devuelven "objetos anidados".

```text
Anti-patrón:

  customer.getAddress().getCity().setName("Madrid")

  → Múltiples getters que atraviesan la encapsulación.
  → El cliente hace el trabajo que el objeto debería hacer.
  → Acoplamiento profundo.
```

> [!tip> Tell, don't ask
> El libro recoge la fórmula de Fowler: "Tell, don't ask". El objeto debe **hacer** las cosas, no **exponer** los datos para que otro haga.

## Receta 3.11: Prevenir object orgy

### Problema

Tu objeto expone sus colecciones internas y permite a otros modificarlas.

```java
public class Customer {
    private List<Order> orders;
    
    public List<Order> getOrders() {
        return orders;  // ¡referencia directa!
    }
    
    public void addOrder(Order order) {
        orders.add(order);
    }
}
```

```java
// Cliente
customer.getOrders().clear();  // ¡vacía los orders del customer!
```

### Solución

Devuelve **copias** de las colecciones, o **vistas inmutables**.

```java
public class Customer {
    private List<Order> orders;
    
    public List<Order> getOrders() {
        return Collections.unmodifiableList(orders);
    }
    
    // Para manipular, métodos específicos
    public void addOrder(Order order) {
        orders.add(order);
    }
    
    public void cancelOrder(Order order) {
        orders.remove(order);
    }
}
```

### Discusión

El libro señala que el **object orgy** es uno de los antipatrones más comunes en código Java:

```text
Anti-patrón:

  List<Order> orders = customer.getOrders();
  orders.clear();  // modifica el estado interno del customer

  → El cliente tiene acceso a la lista interna.
  → Puede modificarla sin pasar por el customer.
  → El encapsulación se rompe.
```

> [!danger> Devolver colecciones internas es un agujero
> El libro es claro: **nunca** devuelvas una referencia mutable a una colección interna. Devuelve inmutables, copias, o vistas inmutables.

## Patrones de encapsulación

El libro cierra el capítulo con patrones útiles para encapsular:

### Patrón 1: copia defensiva

```java
public List<Order> getOrders() {
    return new ArrayList<>(orders);  // copia
}
```

### Patrón 2: vista inmutable

```java
public List<Order> getOrders() {
    return Collections.unmodifiableList(orders);
}
```

### Patrón 3: iterator

```java
public Iterator<Order> getOrders() {
    return orders.iterator();
}
```

### Patrón 4: stream

```java
public Stream<Order> getOrders() {
    return orders.stream();
}
```

> [!tip> El stream es elegante
> El libro recomienda `Stream` cuando el lenguaje lo soporte. El cliente puede transformar los datos sin tocar la colección interna.

## Resumen de la lucha contra la anemicidad

El libro resume el proceso de transformación:

```text
Paso 1: detectar.
  El objeto es data + getters + setters?
  → Probablemente anémico.

Paso 2: transformar.
  Mover comportamiento al objeto.
  Eliminar setters.
  Completar constructores.

Paso 3: encapsular.
  Eliminar getters innecesarios.
  Devolver vistas inmutables.
  Bloquear doble encapsulación.

Paso 4: verificar.
  ¿El objeto tiene verbos?
  ¿Las invariantes están protegidas?
  ¿El MAPPER está satisfecho?
```

## Anti-patterns que el libro combate

El libro enumera los **anti-patrones** que producen anemicidad:

| Anti-pattern | Síntoma | Receta |
|---|---|---|
| **Anemic Domain Model** | Objetos sin comportamiento | Mover comportamiento al objeto |
| **Data Class** | Solo atributos y getters | Agregar comportamiento |
| **DTO Everywhere** | DTOs para todo | Usar objetos de dominio |
| **Service Layer Only** | Toda la lógica en services | Distribuir a los objetos |
| **Bean Hell** | Objetos con auto-properties | Métodos explícitos |
| **Fake Objects** | Objetos con setters para tests | Factory methods |

> [!tip> El libro es claro
> Cada anti-pattern es una **señal** de que algo falla. Las recetas son **curas**, pero diagnosticar primero es esencial.

## El ecosistema de la anemicidad

El libro señala que la anemicidad no surge en el vacío. Surge de:

- **Frameworks** que generan solo getters y setters.
- **Cursos** que enseñan patrones data-driven.
- **Empresas** que premian la entrega rápida, no el diseño.
- **Falta de test coverage** que impide refactorings inseguros.

> [!note> El libro es político
> Contieri no evade la cuestión: la anemicidad es un **problema de industria**, no solo de técnica. Combatirla requiere disciplina individual, pero también cultura de equipo.

## Resumen en tres frases

- Los **DTOs** son la exportación del problema anémico. Úsalos solo donde la **comunicación externa** los exige.
- **Setters y getters** deben ser la excepción, no la regla. El objeto expone comportamiento, no datos.
- La **doble encapsulación** y el **object orgy** son trampas comunes. Devuelve vistas inmutables, no referencias mutables.

## Próximos pasos

- [[05-primitive-obsession-parte-1|Primitive Obsession - parte 1]]: el otro gran code smell. Cuando usamos primitivos (int, String, Date) en lugar de objetos del dominio. Las primeras recetas.
