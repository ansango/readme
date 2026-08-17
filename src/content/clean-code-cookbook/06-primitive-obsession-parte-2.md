---
title: "Primitive Obsession - parte 2"
description: "Las recetas finales del capítulo 4: reificar timestamps, reificar subconjuntos como objetos, reificar validaciones de strings, eliminar propiedades innecesarias"
date: 2026-08-17
mod: 2026-08-17
published: true
tags: [clean-code, primitive-obsession, refactoring, value-objects, validation]
---

# Primitive Obsession - parte 2

> [!abstract] Resumen
> Esta nota cubre las recetas 4.5 a 4.8 del libro: la limpieza final de la obsesión por primitivos. Reificar timestamps, reificar subconjuntos, reificar validaciones de strings y eliminar propiedades innecesarias. La obsesión por primitivos es uno de los code smells más comunes, y romperlo es una de las refactorings con más retorno.

## Receta 4.5: Reificar timestamps

### Problema

Usas tipos de fecha y hora como `Date`, `LocalDate`, `Instant` directamente. Pero los timestamps tienen **semántica de dominio** que se pierde.

```python
# Anti-patrón
created_at = datetime.now()
scheduled_at = datetime.now() + timedelta(days=7)
expires_at = scheduled_at + timedelta(days=30)

# ¿Qué zona horaria? ¿qué precisión? ¿es UTC?
```

### Solución

Crear **value objects** específicos para los timestamps del dominio.

```python
from datetime import datetime, timezone


class EventTime:
    """Tiempo de un evento del dominio. Siempre UTC."""
    
    def __init__(self, value: datetime):
        if value.tzinfo is None:
            raise ValueError("EventTime must be timezone-aware")
        self._value = value.astimezone(timezone.utc)
    
    @classmethod
    def now(cls) -> "EventTime":
        return cls(datetime.now(timezone.utc))
    
    @classmethod
    def from_string(cls, value: str) -> "EventTime":
        # ISO 8601 with timezone
        return cls(datetime.fromisoformat(value))
    
    def add_days(self, days: int) -> "EventTime":
        from datetime import timedelta
        return EventTime(self._value + timedelta(days=days))
    
    def is_before(self, other: "EventTime") -> bool:
        return self._value < other._value
    
    def is_after(self, other: "EventTime") -> bool:
        return self._value > other._value
    
    def to_string(self) -> str:
        return self._value.isoformat()
```

### Discusión

El libro señala que los timestamps son **uno de los primitivos más peligrosos** porque los errores son sutiles:

```text
Errores comunes:

  - Confundir UTC con local time.
  - Comparar timestamps de zonas distintas.
  - Usar fechas en lugar de datetimes (pierdes tiempo).
  - Asumir precisión de milisegundos cuando es segundos.
  - Olvidar el manejo de DST.
```

> [!tip> Crea un wrapper para tu dominio
> El libro recomienda: cada timestamp del dominio merece su propio value object. `EventTime`, `ScheduledTime`, `ExpiresAt`, `CreatedAt`. Cada uno con su semántica.

```python
class EventTime:
    """Un evento del dominio. En UTC."""

class ScheduledTime:
    """Un momento futuro previsto."""

class ExpiresAt:
    """Un momento de expiración. Inmutable."""

class HistoricalDate:
    """Una fecha histórica. Sin zona horaria, precisión de día."""
```

> [!note> No todos los timestamps son iguales
> El libro es claro: un timestamp de "evento histórico" y un timestamp de "calendario de reservas" tienen **distintos requisitos**. No uses el mismo tipo para ambos.

## Receta 4.6: Reificar subconjuntos como objetos

### Problema

Tienes un atributo que representa un **subconjunto** sin reificarlo.

```python
# Subconjunto no reificado
class User:
    def __init__(self, name, email):
        self.name = name
        self.email = email
        self.roles = ["admin", "user"]  # subconjunto de roles
        self.permissions = ["read", "write", "delete"]  # subconjunto de permisos
```

```python
# Cliente (anémico)
if "admin" in user.roles:
    # ...
```

### Solución

Crear **value objects** para los subconjuntos.

```python
from enum import Enum
from typing import Set


class Role(Enum):
    ADMIN = "admin"
    USER = "user"
    GUEST = "guest"


class Permission(Enum):
    READ = "read"
    WRITE = "write"
    DELETE = "delete"
    EXECUTE = "execute"


class Roles:
    """Conjunto de roles del usuario."""
    
    def __init__(self, roles: Set[Role]):
        self._roles = set(roles)
    
    def has(self, role: Role) -> bool:
        return role in self._roles
    
    def add(self, role: Role) -> "Roles":
        return Roles(self._roles | {role})
    
    def remove(self, role: Role) -> "Roles":
        return Roles(self._roles - {role})
    
    def is_admin(self) -> bool:
        return self.has(Role.ADMIN)


class Permissions:
    """Conjunto de permisos del usuario."""
    
    def __init__(self, permissions: Set[Permission]):
        self._permissions = set(permissions)
    
    def has(self, permission: Permission) -> bool:
        return permission in self._permissions
    
    def can_read(self) -> bool:
        return self.has(Permission.READ)
    
    def can_write(self) -> bool:
        return self.has(Permission.WRITE)


class User:
    def __init__(self, name: str, email: str, roles: Roles, permissions: Permissions):
        self.name = name
        self.email = email
        self._roles = roles
        self._permissions = permissions
```

### Discusión

El libro argumenta que los **subconjuntos no reificados** son especialmente peligrosos:

```text
Problemas:

  - Errores de typo en strings.
  - Validación ausente (¿cualquier string es un rol válido?).
  - Comportamiento disperso (¿dónde está la lógica de "tiene permiso de admin"?).
  - Inmutabilidad rota (listas mutables).
```

> [!tip> El libro es claro
> Cualquier atributo que sea un **conjunto de conceptos del dominio** debe ser un value object. Los ejemplos típicos: roles, permisos, tags, categorías, canales.

```python
# Cliente (legible)
if user.roles.is_admin():
    # ...
```

## Receta 4.7: Reificar validaciones de strings

### Problema

Tienes strings que se validan en muchos sitios del código.

```python
# Validación dispersa
def send_email(to_email):
    if "@" not in to_email:
        raise ValueError("Invalid email")
    # ...

def register(email):
    if "@" not in email:
        raise ValueError("Invalid email")
    # ...

def update_profile(email):
    if "@" not in email:
        raise ValueError("Invalid email")
    # ...
```

### Solución

Centralizar la validación en un **value object**.

```python
class Email:
    """Email validado."""
    
    def __init__(self, value: str):
        if not self._is_valid(value):
            raise ValueError(f"Invalid email: {value}")
        self._value = value.lower()
    
    @staticmethod
    def _is_valid(value: str) -> bool:
        return (
            "@" in value
            and "." in value
            and len(value) >= 5
            and " " not in value
        )
    
    @property
    def value(self) -> str:
        return self._value
    
    def __eq__(self, other):
        return isinstance(other, Email) and self._value == other._value
    
    def __hash__(self):
        return hash(self._value)
```

```python
# Una vez Email existe, no hay validaciones dispersas
def send_email(to_email: Email):
    # to_email ya está validado
    # ...
```

### Discusión

El libro recoge los **patrones** de validación que se repiten:

```text
Validaciones comunes:

  - Email: tiene @, formato válido.
  - Teléfono: solo dígitos, longitud correcta.
  - URL: empieza por http(s), dominio válido.
  - Código postal: formato del país.
  - DNI/NIF: formato del país.
  - IBAN: formato del país.
  - UUID: formato hexadecimal.
  - IP: v4 o v6.

Si las haces una vez en el value object, no las repites.
```

> [!tip> El libro es claro
> El trabajo está en **definir el value object una vez**. Después, todo el código se beneficia. Sin duplicación, sin inconsistencias.

### Cuando usar regex

El libro señala: regex es poderoso pero **frágil**. Solo cuando el formato es estable y la regex es simple.

```python
import re

EMAIL_PATTERN = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")

class Email:
    def __init__(self, value: str):
        if not EMAIL_PATTERN.match(value):
            raise ValueError(f"Invalid email: {value}")
        self._value = value.lower()
```

> [!warning] Regex complicadas
> El libro es claro: si tu regex tiene más de 50 caracteres, **probablemente** estás intentando demasiado. Considera un parser.

## Receta 4.8: Eliminar propiedades innecesarias

### Problema

Tu objeto tiene propiedades que **no se usan**, o se usan en partes muy específicas.

```python
class User:
    def __init__(self, name, email, phone, address, last_login, referrer, locale, ...):
        self.name = name
        self.email = email
        self.phone = phone
        self.address = address
        self.last_login = last_login
        # ...
```

```python
# ¿Cuándo se usa phone? ¿en qué código?
# ¿Y referrer? ¿es del modelo?
```

### Solución

Eliminar lo que no se usa. Si hace falta después, **reintroducirlo entonces**.

```python
class User:
    def __init__(self, name: str, email: Email):
        self.name = name
        self.email = email
```

> [!tip> YAGNI: You Aren't Gonna Need It
> El libro recoge el principio de programación extrema: **no añadas funcionalidad hasta que la necesites**. Las propiedades sin usar son lastre.

### Discusión

El libro señala que las propiedades innecesarias vienen de:

```text
Fuentes comunes:

  - Copiar de otros objetos sin pensar.
  - Replicar el esquema de la base de datos.
  - Querer "preparar para el futuro".
  - Heredar de clases padre sin cuestionar.

Cada fuente añade peso al modelo.
```

> [!danger> El "preparar para el futuro" es un anti-patrón
> El libro es claro: **no prepares para el futuro**. Añade cuando haga falta. Las propiedades no usadas **envenenan** el modelo: cambian el contrato, requieren migraciones, complican los tests.

```text
Test de la propiedad:

  - ¿Se usa en al menos 2 sitios?
  - ¿Tiene invariantes que proteger?
  - ¿Aparece en al menos un test?

Si no a alguna, eliminarla.
```

## Patrones de value objects

El libro cierra el capítulo con un resumen de **cuándo reificar**:

### Reificar cuando:

```text
- El dominio le da nombre al valor.
- Hay validaciones que aplicar.
- Hay invariantes que proteger.
- Hay comportamiento que aplicar.
- Hay comparaciones que hacer.
- Hay conversiones que simplificar.
```

### No reificar cuando:

```text
- Es primitivo puro (counter, raw data).
- Es rendimiento crítico.
- Es solo transporte (JSON, parsing).
- Es un detalle de implementación.
```

## Value objects en un dominio real

El libro da un ejemplo de un dominio real:

```text
Dominio: reservas de hotel.

Value objects:
  - ReservationId (UUID validado).
  - GuestName (string validado).
  - Email (validado).
  - PhoneNumber (validado).
  - CheckInDate (fecha sin tiempo).
  - CheckOutDate (fecha sin tiempo).
  - NumberOfGuests (int validado).
  - RoomRate (Money con currency).
  - ReservationStatus (enum: CONFIRMED, CANCELLED, NO_SHOW, CHECKED_IN, CHECKED_OUT).

Beneficio:
  - Validación centralizada.
  - Comportamiento en el dato.
  - Comparación por valor.
  - Inmutabilidad.
```

> [!tip> El libro es claro
> Los value objects son la **infraestructura invisible** del MAPPER. Sin ellos, el dominio se filtra en primitivos por todos lados.

## La obsesión por primitivos en diferentes lenguajes

El libro señala que cada lenguaje tiene sus **primitivos peligrosos**:

```text
Lenguajes y primitivos peligrosos:

  - Java: int, long, double, String, Date.
  - JavaScript: number, string, boolean, Date, Object.
  - Python: int, str, float, datetime, dict.
  - C#: int, long, double, string, DateTime.
  - C++: int, char*, double, raw pointers.
  - Ruby: Integer, String, Hash, Symbol.

Todos sirven para construir MAPPER contra el dominio.
```

## Anti-mapper final

El libro termina el capítulo con el diagnóstico:

```text
Anti-mapper:

  - Primitivos en lugar de value objects.
  - Validaciones dispersas.
  - Enums como strings.
  - Dicts como entidades.
  - Sets como magic numbers.

Cada uno es un smell que la receta correspondiente corrige.
```

## Resumen en tres frases

- **Timestamps** tienen semántica de dominio. Reificar con clases específicas.
- **Subconjuntos** (roles, permisos, tags) son value objects, no listas de strings.
- **Validaciones** se centralizan en value objects, no se dispersan por el código.

## Próximos pasos

- [[07-glosario-y-referencias|Glosario y referencias]]: el cierre de la wiki. Glosario del libro, libros de referencia (Fowler, Martin, Contieri, Feathers) y rutas de profundización.
- [[08-epilogo-y-claves|Epílogo y claves]]: cierre con ideas recurrentes y cómo seguir.
