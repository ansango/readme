---
title: "Primitive Obsession - parte 1"
description: "Las primeras recetas para dejar de usar primitivos en lugar de objetos del dominio: crear objetos pequeños, reificar datos primitivos, reificar arrays asociativos, eliminar abusos de strings"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [clean-code, primitive-obsession, refactoring, value-objects, ddd]
---

# Primitive Obsession - parte 1

> [!abstract] Resumen
> Esta nota cubre las primeras cuatro recetas del capítulo 4, dedicadas al **primitive obsession**: el code smell que aparece cuando usamos tipos primitivos (int, String, Date) en lugar de objetos del dominio. Las recetas son: crear objetos pequeños, reificar datos primitivos, reificar arrays asociativos y eliminar abusos de strings. El objetivo es **devolver el dominio al código**.

## Por qué importa

El libro abre con una observación radical: **los primitivos son el anti-mapper**.

```text
Primitivos comunes:

  - int, long, float, double
  - String
  - boolean
  - Date, LocalDate, Instant
  - arrays, listas, maps
  - UUID
  - enums (a veces)

El problema:
  - No expresan el dominio.
  - Son intercambiables.
  - No validan.
  - No tienen comportamiento.
```

> [!quote> "Primitives are not domain."
> El libro es claro: un `int` no es un precio, una edad, una cantidad. Es un número. El **precio**, la **edad**, la **cantidad** son conceptos del dominio.

## Receta 4.1: Crear objetos pequeños

### Problema

Usas tipos primitivos para datos que tienen semántica de dominio.

```python
# Anémico
def create_user(name: str, email: str, age: int):
    if "@" not in email:
        raise ValueError("Invalid email")
    if age < 0:
        raise ValueError("Invalid age")
    return {"name": name, "email": email, "age": age}
```

### Solución

Crea **objetos pequeños** con la lógica encapsulada.

```python
class Email:
    def __init__(self, value: str):
        if "@" not in value:
            raise ValueError("Invalid email")
        self._value = value.lower()
    
    @property
    def value(self) -> str:
        return self._value
    
    def __eq__(self, other):
        return isinstance(other, Email) and self._value == other._value
    
    def __hash__(self):
        return hash(self._value)


class Age:
    def __init__(self, value: int):
        if value < 0 or value > 150:
            raise ValueError("Invalid age")
        self._value = value
    
    @property
    def value(self) -> int:
        return self._value


class User:
    def __init__(self, name: str, email: Email, age: Age):
        self.name = name
        self.email = email
        self.age = age
```

### Discusión

El libro argumenta que **los objetos pequeños son la unidad del MAPPER**:

```text
Test del MAPPER con objetos:

  - ¿El experto del dominio puede ver Customer.email?
  - ¿El experto del dominio entiende qué es Age?
  - ¿El experto del dominio entiende las validaciones?

Si todo es int, str, bool, el experto no entiende nada.
```

> [!tip> El sobrecoste de crear objetos
> El libro es claro: crear objetos pequeños tiene un coste en líneas de código. Pero el **beneficio es la validación automática**. Si `Age` no se puede construir con valor negativo, no hay `if age < 0` en todo el código.

### Cuándo SÍ usar primitivos

El libro es pragmático:

```text
Primitivos aceptables:

  - En código de bajo nivel (algoritmos, parsing).
  - En performance-critical paths.
  - En DTOs de comunicación externa.
  - En tests donde la simplicidad importa.

No en lógica de negocio.
```

## Receta 4.2: Reificar datos primitivos

### Problema

Tienes un `int` que representa un precio, pero el código hace `price + tax` sin saber que está sumando dinero.

```python
# Conceptual
price = 100  # ¿moneda? ¿cents?
tax = 21    # ¿porcentaje? ¿miles?
total = price + tax  # ¿qué operación?
```

### Solución

Crear una **clase Money** o **clase Price** que sea específica.

```python
from enum import Enum
from decimal import Decimal


class Currency(Enum):
    USD = "USD"
    EUR = "EUR"
    GBP = "GBP"


class Money:
    def __init__(self, amount: Decimal, currency: Currency):
        self.amount = amount
        self.currency = currency
    
    def add(self, other: "Money") -> "Money":
        """Suma amounts de la misma moneda."""
        if self.currency != other.currency:
            raise ValueError(f"Cannot add {self.currency} and {other.currency}")
        return Money(self.amount + other.amount, self.currency)
    
    def apply_tax(self, percentage: Decimal) -> "Money":
        """Aplica un impuesto (porcentaje)."""
        return Money(self.amount * (Decimal("1") + percentage / Decimal("100")), self.currency)
    
    def __eq__(self, other):
        return isinstance(other, Money) and self.amount == other.amount and self.currency == other.currency


# Uso
price = Money(Decimal("100.00"), Currency.EUR)
tax = Decimal("21")  # 21%
total = price.apply_tax(tax)
```

> [!tip> El libro es claro
> Crear `Money` es una de las refactorings más valiosas. Una vez que tienes `Money`, todos los errores de moneda y redondeo se centralizan.

### Patrones de reificación

El libro recoge los datos más comunes a reificar:

```text
Datos primitivos a reificar:

  - Dinero (cantidad + moneda).
  - Fecha con zona horaria.
  - Porcentaje (0-100, no float).
  - Email (validado).
  - Teléfono (formato).
  - URL (parseable).
  - Coordenada (lat + lng).
  - Dirección (calle, ciudad, código postal).
  - Color (RGB, hex).
  - Cantidad con unidad (kg, m, ...).
```

> [!tip> Empieza por donde más bugs hay
> El libro recomienda: empieza por reificar los datos que más bugs han generado. El equipo sabe cuáles son.

## Receta 4.3: Reificar arrays asociativos

### Problema

Usas un `dict` (o `Map`, o `HashMap`) para representar datos con estructura.

```python
# Array asociativo
user = {
    "name": "Ana",
    "email": "ana@example.com",
    "age": 30,
    "premium": True
}

# No hay validación.
# No hay comportamiento.
# No hay tipos.
```

### Solución

Crear **objetos pequeños** en lugar de dicts.

```python
class User:
    def __init__(self, name: str, email: Email, age: Age, premium: bool):
        self._name = name
        self._email = email
        self._age = age
        self._premium = premium
    
    def deactivate(self):
        self._premium = False
    
    def is_premium(self) -> bool:
        return self._premium
```

### Discusión

El libro es claro: los **arrays asociativos** son a menudo **schemas disfrazados**.

```text
Cuándo los dicts son legítimos:

  - JSON parsing.
  - Configuración externa.
  - Mapas clave-valor reales (caches, diccionarios).
  - Migración de datos.

Cuándo NO son legítimos:

  - Modelar entidades del dominio.
  - Modelar datos con estructura compleja.
  - Pasar datos entre capas internas.
```

> [!danger> Los dicts son el primer paso a la anemicidad
> El libro es claro: si tu código tiene dicts con claves como `"name"`, `"email"`, `"age"`, **es un objeto anémico disfrazado**. Conviértelo en clase.

```python
# Anti-patrón (dict con schema implícito)
def process_order(order_data):
    if order_data["status"] == "pending":
        # ...

# Mejor (objeto con tipo)
def process_order(order: Order):
    if order.is_pending():
        # ...
```

## Receta 4.4: Eliminar abusos de strings

### Problema

Usas `String` para representar datos que no son texto.

```python
# Strings como enum
status = "active"  # ¿active, ACTIVE, Active, act?

# Strings como fecha
date = "2023-12-15"  # ¿formato? ¿zona horaria?

# Strings como boolean
is_active = "true"  # ¿"true", "True", "TRUE", "1"?

# Strings como enum compuesto
priority = "high"  # ¿high, High, HIGH, h?
```

### Solución

Usar **tipos específicos** para cada concepto.

```python
from enum import Enum


class Status(Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"
    
    @classmethod
    def from_string(cls, value: str):
        return cls(value.lower())


class Date:
    def __init__(self, year: int, month: int, day: int):
        # ... con validación
        pass


class Boolean:
    """Si necesitas un string que representa bool, pregúntate por qué."""
    pass
```

### Discusión

El libro señala que los **abusos de string** son muy comunes:

```text
Anti-patrones comunes:

  - status = "active"
  - date = "2023-12-15"
  - color = "red"
  - role = "admin"
  - currency = "USD"
  - priority = "high"

Cada uno debería ser un tipo, no un string.
```

> [!tip> Los enums no son solo para constantes
> El libro señala: los enums (`Enum` en Java, Python, etc.) son **una oportunidad de MAPPER**. Definen **a qué valores** puede tomar un atributo, en el dominio.

```python
# Antes
role = "admin"  # typo: "admni" pasa silencioso

# Después
class Role(Enum):
    ADMIN = "admin"
    USER = "user"
    GUEST = "guest"

role = Role.ADMIN  # typo: AttributeError
```

## Los primitivos como "code smell"

El libro es claro: **los primitivos son un code smell cuando representan conceptos del dominio**.

```text
Pregunta: ¿este primitivo tiene significado en el dominio?

  - int amount: sí, es dinero → reificar.
  - int temperature: sí, es temperatura → reificar.
  - int counter: no, es un contador → primitivo OK.
  - bool is_active: sí, es estado → reificar con enum.
  - String email: sí, es email → reificar.
  - String raw_payload: no, es texto crudo → primitivo OK.
```

> [!tip> El principio de reificación
> El libro resume: **si el dominio le da nombre al valor, el código debe usar ese nombre**, no un primitivo.

## El problema de los static helpers

El libro señala que cuando reificamos, solemos meter la lógica en **static helpers**:

```java
// Antes
double price = 100.0;
double tax = price * 0.21;

// Después (mal)
class Price {
    private double amount;
    
    public static double calculateTax(double price, double percentage) {
        // lógica en static
    }
}

// Después (bien)
class Price {
    private double amount;
    
    public Price applyTax(double percentage) {
        return new Price(this.amount * (1 + percentage / 100));
    }
}
```

> [!danger> Static helpers son el primer paso a la anemicidad
> El libro es claro: si la lógica está en **static methods**, no está en el objeto. El objeto es solo data. Volvemos a la anemicidad con diferente sintaxis.

## Value objects

El libro recoge el patrón de **value objects** (DDD):

```text
Value object:

  - Sin identidad (dos Money(100, EUR) son iguales).
  - Inmutable.
  - Comportamiento funcional.
  - Validación en construcción.
```

```python
class Money:
    """Value object inmutable."""
    
    def __init__(self, amount: Decimal, currency: Currency):
        if amount < 0:
            raise ValueError("Money cannot be negative")
        self.amount = amount
        self.currency = currency
    
    def add(self, other: "Money") -> "Money":
        if self.currency != other.currency:
            raise ValueError("Cannot add different currencies")
        return Money(self.amount + other.amount, self.currency)
    
    # No hay setters.
    # Es inmutable.
    # Tiene comportamiento.
```

> [!tip> Value objects vs entidades
> El libro distingue:
> - **Value object**: sin identidad. Comparación por valor. (Money, Email, Date)
> - **Entity**: con identidad. Comparación por identidad. (Customer, Order)

## Patrones de construcción

El libro recoge cómo construir value objects:

### Constructor con validación

```python
class Email:
    def __init__(self, value: str):
        if not self._is_valid(value):
            raise ValueError(f"Invalid email: {value}")
        self._value = value
    
    @staticmethod
    def _is_valid(value: str) -> bool:
        return "@" in value and "." in value
```

### Factory method

```python
class Date:
    @classmethod
    def from_string(cls, value: str) -> "Date":
        year, month, day = value.split("-")
        return cls(int(year), int(month), int(day))
```

### Builder

```python
class Email:
    class Builder:
        def __init__(self):
            self._value = ""
        
        def value(self, value: str) -> "Builder":
            self._value = value
            return self
        
        def build(self) -> "Email":
            return Email(self._value)
    
    @classmethod
    def builder(cls) -> "Builder":
        return cls.Builder()
```

> [!tip> El builder es para casos complejos
> El libro es claro: el builder es para value objects con **muchos campos opcionales**. Para la mayoría, el constructor con argumentos es suficiente.

## Value objects en colecciones

El libro señala que los value objects también ayudan en colecciones:

```python
# Antes
emails = ["ana@x.com", "bob@x.com", ""]
# Riesgo: string vacío.

# Después
emails = [Email("ana@x.com"), Email("bob@x.com")]
# Si el string es inválido, no se construye.
```

## La regla de oro

El libro resume toda la receta en una frase:

> [!quote> "If a domain concept has a name, it should be a class."
> El libro es claro: si el dominio le da nombre a algo, el código debe tener una clase para ello. Sin excepciones (salvo rendimiento extremo).

## Resumen en tres frases

- **Primitive obsession** es usar primitivos (`int`, `String`, `Date`) para conceptos del dominio. La cura es **reificar**: crear clases específicas.
- Los **value objects** son la herramienta principal: dinero, fecha, email, dirección. Sin identidad, inmutables, con validación.
- Los **abusos de string** son un sub-caso: status como string, fecha como string, enum como string. Cada uno debe ser un tipo.

## Próximos pasos

- [[06-primitive-obsession-parte-2|Primitive Obsession - parte 2]]: las recetas restantes. Reificar timestamps, reificar subconjuntos, reificar validaciones de strings, eliminar propiedades innecesarias.
