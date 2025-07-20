# Testing BillingCycle API Implementation

## 1. Generar y aplicar migraciones

```bash
# Navegar al directorio del backend
cd backend

# Generar migración para el nuevo modelo BillingCycle
python manage.py makemigrations properties

# Aplicar las migraciones
python manage.py migrate

# Verificar que la migración se aplicó correctamente
python manage.py showmigrations properties
```

## 2. Ejecutar las pruebas

```bash
# Ejecutar todas las pruebas del módulo BillingCycle
python manage.py test properties.tests.test_billing_cycle_api

# Ejecutar una prueba específica
python manage.py test properties.tests.test_billing_cycle_api.BillingCycleAPITestCase.test_create_billing_cycle_success

# Ejecutar con mayor verbosidad
python manage.py test properties.tests.test_billing_cycle_api -v 2
```

## 3. Endpoints implementados

### POST /api/properties/{property_id}/billing-cycles/
Crear un nuevo ciclo de facturación

**Request:**
```json
{
    "month": 7,
    "year": 2024
}
```

**Response (201 Created):**
```json
{
    "id": 1,
    "property": 6,
    "property_name": "Edificio Central",
    "month": 7,
    "year": 2024,
    "status": "open",
    "status_display": "Abierto",
    "created_at": "2024-07-20T12:00:00Z",
    "updated_at": "2024-07-20T12:00:00Z"
}
```

**Response (409 Conflict):**
```json
{
    "error": "Ya existe un ciclo de facturación para esta propiedad en este mes y año."
}
```

### GET /api/properties/{property_id}/billing-cycles/
Listar ciclos de facturación de una propiedad

**Response (200 OK):**
```json
[
    {
        "id": 2,
        "property": 6,
        "property_name": "Edificio Central",
        "month": 8,
        "year": 2024,
        "status": "open",
        "status_display": "Abierto",
        "created_at": "2024-08-20T12:00:00Z",
        "updated_at": "2024-08-20T12:00:00Z"
    },
    {
        "id": 1,
        "property": 6,
        "property_name": "Edificio Central",
        "month": 7,
        "year": 2024,
        "status": "open",
        "status_display": "Abierto",
        "created_at": "2024-07-20T12:00:00Z",
        "updated_at": "2024-07-20T12:00:00Z"
    }
]
```

### GET /api/billing-cycles/{cycle_id}/
Obtener detalles de un ciclo específico

**Response (200 OK):**
```json
{
    "id": 1,
    "property": 6,
    "property_name": "Edificio Central",
    "month": 7,
    "year": 2024,
    "status": "open",
    "status_display": "Abierto",
    "created_at": "2024-07-20T12:00:00Z",
    "updated_at": "2024-07-20T12:00:00Z"
}
```

## 4. Validaciones implementadas

- ✅ **Autenticación requerida**: Todos los endpoints requieren JWT token
- ✅ **Propiedad ownership**: Solo el propietario puede gestionar los ciclos de su propiedad
- ✅ **Unicidad**: No se pueden crear duplicados para el mismo mes/año/propiedad
- ✅ **Fechas futuras**: No se permiten ciclos para fechas futuras
- ✅ **Rango de mes**: Solo valores 1-12
- ✅ **Rango de año**: Solo valores 2020-2030
- ✅ **Estado por defecto**: Los ciclos se crean con status "open"

## 5. Casos de prueba cubiertos

✅ **Creación exitosa** de ciclo de facturación
✅ **Conflicto 409** al intentar crear duplicados
✅ **Error 400** para fechas futuras
✅ **Error 400** para mes/año inválidos
✅ **Error 404** para propiedades ajenas
✅ **Error 401** sin autenticación
✅ **Listado exitoso** de ciclos
✅ **Listado vacío** cuando no hay ciclos
✅ **Detalle exitoso** de ciclo específico
✅ **Ordenamiento** correcto (más reciente primero)
✅ **Representación string** del modelo
✅ **Restricción de unicidad** a nivel de BD

## 6. Prueba manual con curl

```bash
# 1. Obtener token de autenticación
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "usuario@test.com", "password": "password123"}'

# 2. Crear ciclo de facturación
curl -X POST http://localhost:8000/api/properties/6/billing-cycles/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"month": 7, "year": 2024}'

# 3. Listar ciclos de una propiedad
curl -X GET http://localhost:8000/api/properties/6/billing-cycles/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 4. Obtener detalles de un ciclo específico
curl -X GET http://localhost:8000/api/billing-cycles/1/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 7. Base de datos

**Tabla:** `properties_billingcycle`

**Campos:**
- `id` (AutoField, PK)
- `property_id` (ForeignKey a Property)
- `month` (PositiveSmallIntegerField, 1-12)
- `year` (PositiveIntegerField)
- `status` (CharField, choices: open/in_review/closed)
- `created_at` (DateTimeField)
- `updated_at` (DateTimeField)

**Restricciones:**
- `unique_property_month_year_billing_cycle` (property, month, year)

**Índices:**
- Ordenamiento por defecto: `-year`, `-month`