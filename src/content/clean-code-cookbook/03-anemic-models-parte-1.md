---
title: "Anemic Models - parte 1"
description: "Las primeras recetas del cookbook: detectar objetos anémicos, entender la esencia, convertir objetos en rich objects, eliminar setters y generadores de código anémico"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [clean-code, anemic-models, refactoring, oop, encapsulation]
---

# Anemic Models - parte 1

> [!abstract] Resumen
> Esta nota cubre las primeras cinco recetas del capítulo 3. Empezamos por entender qué es un objeto anémico y por qué es un problema, pasamos por la conversión de anémicos en rich objects, la identificación de la "esencia" del objeto, y la eliminación de setters y de generadores de código anémico. La receta es la misma: volver a poner el comportamiento en el objeto.

## El anti-mapper por excelencia

El libro arranca el capítulo 3 con una afirmación directa: **los objetos anémicos son la forma más común de violar el MAPPER**.

```text
Objeto anémico:

  - Atributos privados (o públicos).
  - Getters y setters para todos.
  - Cero comportamiento.
  - Toda la lógica en clases "service" externas.

Anti-mapper porque:
  - El objeto no modela comportamiento del dominio.
  - El objeto es solo "data".
  - El comportamiento está en otros lugares.
```

> [!quote] "Anemic objects are objects that have no behavior. They are just data containers."
> El libro es claro: un objeto sin comportamiento está **roto** desde la perspectiva del diseño orientado a objetos.

### Por qué los objetos anémicos son un problema

```text
Problemas:

  - Las invariantes no se protegen.
  - Los datos se corrompen fácilmente.
  - El código está disperso.
  - Los tests son complejos.
  - El modelo no refleja el dominio.
  - El MAPPER está violado.
```

> [!danger> El modelo anémico es popular
> El libro advierte: los frameworks que generan solo atributos y setters (JPA, ActiveRecord, etc.) **facilitan** la creación de objetos anémicos. La facilidad es una trampa.

## Receta 3.1: Convertir anemic objects en rich objects

### Problema

Tienes un objeto sin comportamiento. Todas las operaciones se hacen en clases "service" o "manager".

```python
# Objeto anémico
class Customer:
    def __init__(self, name, email):
        self.name = name
        self.email = email
        self.status = "active"


# Lógica en service
class CustomerService:
    def activate(self, customer):
        if customer.status == "inactive":
            customer.status = "active"
    
    def email_is_valid(self, customer):
        return "@" in customer.email
```

### Solución

Mueve el comportamiento al objeto. El objeto se convierte en **fuente de verdad**.

```python
class Customer:
    def __init__(self, name, email):
        self.name = name
        self._email = email
        self._status = "active"
    
    def activate(self):
        if self._status == "inactive":
            self._status = "active"
    
    def is_email_valid(self):
        return "@" in self._email
```

> [!tip] El objeto es responsable de su estado
> El libro señala: si el objeto tiene un atributo, es responsable de validar las transiciones de ese atributo. Mover el método al objeto es la primera refactorización.

### Discusión

El libro distingue entre **comportamiento esencial** y **comportamiento accidental**:

```text
Comportamiento esencial:

  - El comportamiento que está en el dominio.
  - Lo que la entidad HACE en el mundo real.

Comportamiento accidental:

  - El comportamiento que aparece en la implementación.
  - Lo que la entidad hace porque está en el código.
```

> [!note] El libro es claro
> No todo comportamiento va en el objeto. Las operaciones que cruzan varios objetos (transacciones, agregaciones) deben estar en services. El libro aboga por un **balance**.

## Receta 3.2: Identificar la esencia de los objetos

### Problema

Quieres crear invariantes sobre tus objetos y mantenerlas válidas todo el tiempo.

```text
Ejemplo:

  class Date:
      def __init__(self, day, month, year):
          self.day = day
          self.month = month
          self.year = year
  
  # ...
  
  date.setMonth(13)  # ¡inválido!
```

### Solución

No permitas cambios en los atributos **esenciales**. Los atributos esenciales se fijan al crear el objeto y se protegen después.

```python
class Date:
    def __init__(self, day, month, year):
        self._day = day
        self._month = month
        self._year = year
    
    # No hay setMonth. El mes es esencial.
    # Si necesitas un objeto con otro mes, creas otro Date.
```

### Discusión

El libro se apoya en Heráclito:

> [!quote] "Ningún hombre se baña dos veces en el mismo río, porque ni el río es el mismo ni el hombre es el mismo."
> El hombre **es** el mismo en esencia. Su cuerpo **cambia** constantemente.

```text
Aplicado a objetos:

  - Identidad: el objeto es el mismo a lo largo del tiempo.
  - Atributos esenciales: no cambian.
  - Atributos accidentales: pueden cambiar.
  - Comportamiento esencial: define al objeto.
```

> [!tip> El test de esencialidad
> El libro propone: "lo que es esencial en el mundo real debe ser esencial en el modelo". Si en el mundo real un cliente no cambia de nombre, el código no debería permitir cambiar el nombre.

```text
Ripple effect:

  date.setMonth(4)
  → muchas partes del sistema tienen referencias a date
  → cambiar el mes afecta a muchos objetos
  → propagar el cambio es doloroso

  Mejor:
  new_date = Date.from(2023, 3, 25)
  → solo payment referencia a date
  → cambiar payment no afecta a nadie más
```

## Receta 3.3: Eliminar setters de los objetos

### Problema

Quieres proteger tus objetos de la manipulación externa y favorecer la inmutabilidad.

```java
// Anémico
public class Point {
    private int x;
    private int y;
    
    public void setX(int x) { this.x = x; }
    public void setY(int y) { this.y = y; }
}
```

### Solución

Después de hacer los atributos privados, elimina los setters.

```java
// Rich
public class Point {
    private final int x;
    private final int y;
    
    public Point(int x, int y) {
        this.x = x;
        this.y = y;
    }
    
    // No hay setters.
    // Si necesitas otro Point, creas otro.
}
```

> [!warning] Esta refactorización no es safe
> El libro es claro: **eliminar setters puede romper código dependiente**. Antes de hacerlo, necesitas test coverage.

### Discusión

El libro recoge la visión de varios autores:

```text
Martin Fowler:
  "Setter methods are a clear sign of anemic objects."

Robert C. Martin (Clean Code):
  "Setters violate encapsulation."

Bertrand Meyer (Object-Oriented Software Construction):
  "Command-Query Separation: un método que cambia estado no debe devolver valor."
```

> [!tip> Cuándo SÍ necesitas setters
> El libro es pragmático: en algunos casos (objetos de UI, deserialización, ORM), los setters son inevitables. Pero **marca esos setters como tales** y limita su uso.

```python
# Aceptable en casos específicos
class JsonDeserializable:
    """Marker para objetos que se deserializan desde JSON."""
    
    @classmethod
    def from_json(cls, json_str):
        """Factory que necesita asignar atributos."""
        obj = cls.__new__(cls)
        # Asigna atributos aquí
        return obj
```

## Receta 3.4: Eliminar generadores de código anémico

### Problema

Tienes herramientas que generan getters, setters, constructores y otros métodos sin pensar.

```text
Ejemplo en Java:

  @Getter
  @Setter
  @NoArgsConstructor
  @AllArgsConstructor
  public class Customer {
      private String name;
      private String email;
      private Date createdAt;
  }

  → Lombok genera getters, setters, constructores.
  → El resultado es un objeto anémico.
```

### Solución

Usa los generadores solo donde aporten. Para objetos con comportamiento, **escribe los métodos a mano**.

```text
Claves:

  - Generador para constructores sí (reduce boilerplate).
  - Generador para getters en serializadores/UI.
  - Generador para setters solo en deserialización.
  - Comportamiento del dominio: SIEMPRE escrito a mano.
```

> [!note> El libro es claro
> Los generadores como Lombok son útiles, pero **no deben decidir la forma del modelo**. El modelo lo defines tú; los generadores solo eliminan boilerplate.

## Receta 3.5: Evitar propiedades automáticas

### Problema

Tu lenguaje permite declarar propiedades que auto-generan getters y setters.

```python
# Python con @property
class Customer:
    def __init__(self, name, email):
        self.name = name
        self.email = email
```

### Solución

Usa **atributos explícitos** y métodos explícitos. Si necesitas encapsulation, hazla manualmente.

```python
class Customer:
    def __init__(self, name, email):
        self._name = name
        self._email = email
    
    @property
    def name(self):
        return self._name
    
    # No hay setter para name.
```

### Discusión

El libro no es dogmático: en Python, las properties son útiles. Pero señala:

```text
Peligros de las properties automáticas:

  - Si generas @property para todo, tienes getters para todo.
  - Getters para todo → anemic object.
  - El comportamiento esencial se pierde.
```

> [!tip> Una property no es solo un getter
> El libro insiste: una property en Python debe ser **calculada** o tener **lógica**. Si solo devuelve un atributo, es un getter glorificado.

## Patrones: cómo distinguir objetos anémicos

El libro ofrece varios **tests** para saber si un objeto es anémico:

```text
Test 1: ¿Tiene comportamiento esencial?

  Si todas las acciones del objeto están en otra clase,
  el objeto es anémico.

Test 2: ¿La lógica del objeto está dentro del objeto?

  Si la lógica del objeto está en services, controllers, utils,
  el objeto es anémico.

Test 3: ¿El objeto tiene invariantes?

  Si el objeto no protege sus invariantes,
  el comportamiento está disperso.

Test 4: ¿Puedes describir el objeto con un verbo?

  "Customer ___" → ?
  Si el verbo no aparece, el objeto es anémico.
```

> [!tip> El test de los verbos
> El libro recomienda: para cada entidad del dominio, pregúntate "¿qué hace?". Si no puedes enunciar un verbo, el objeto es probablemente anémico.

## La cadena de anemicidad

El libro describe cómo la anemicidad se **propaga**:

```text
Anemic object → Service que tiene toda la lógica → Service que crece → Utility → ...
```

```text
Ejemplo de propagación:

  Customer (anémico)
     ↓
  CustomerService (toda la lógica)
     ↓
  CustomerServiceHelper (código reutilizable)
     ↓
  CustomerServiceHelperUtil (más abstracción)
     ↓
  CustomerServiceHelperUtilFactory (?)

  → Inflación incontrolable.
```

> [!danger> La muerte por mil services
> El libro advierte: una clase "service" que crece sin parar es síntoma de objetos anémicos. La solución no es más abstracción, sino **mover el comportamiento al objeto**.

## Cómo encontrar la esencia

El libro propone un ejercicio para encontrar la esencia de un objeto:

```text
Ejercicio:

  1. Escribe el nombre del objeto.
  2. Escribe 5-10 verbos que aplica este objeto.
  3. Escribe adjetivos (estados) que aplica este objeto.
  4. ¿Son verbos y adjetivos del dominio?
  5. Si sí, son métodos y atributos del objeto.
```

```text
Ejemplo con "Customer":

  Verbos:
    - register
    - activate
    - deactivate
    - place order
    - pay invoice
    - update email

  Adjetivos:
    - active
    - inactive
    - premium
    - blocked

  → Customer debe tener estos métodos y estados.
```

## Balance correcto

El libro cierra con la matización importante: **no todo va en el objeto**.

```text
Va en el objeto:

  - Lógica que afecta SOLO al objeto.
  - Validaciones de invariantes.
  - Transiciones de estado.
  - Cálculos derivados.

Va en un service:

  - Lógica que cruza varios objetos.
  - Orquestación de operaciones.
  - Interacción con infraestructura.
  - Notificaciones a otros sistemas.
```

```text
Ejemplo:

  # En el objeto
  customer.activate()  # solo afecta a customer

  # En un service
  class OrderService:
      def create_order(self, customer, products):
          # customer + products + payment + inventory
          # orquestación
```

> [!note> El libro es claro
> Anemicidad **no** es "tener un service es malo". Es "tener un objeto sin comportamiento". Los services son legítimos cuando **orquestan** varios objetos.

## Resumen en tres frases

- Un objeto anémico **no es un MAPPER** —es solo data. La receta fundamental es mover el comportamiento al objeto.
- Los atributos **esenciales** no deben cambiar; eso es identidad, no estado.
- **Setters, getters automáticos, generadores de código** producen anemicidad. Úsalos con cuidado y solo donde aporten.

## Próximos pasos

- [[04-anemic-models-parte-2|Anemic Models - parte 2]]: las recetas restantes del capítulo. DTOs, constructores vacíos, getters, doble encapsulación, object orgy. La limpieza final de los objetos anémicos.
