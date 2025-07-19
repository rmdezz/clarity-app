from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from ..models import Property

class PropertyAPITest(APITestCase):
    """
    Conjunto de pruebas para el endpoint de la API de Propiedades (/api/properties/).
    Cubre la creación (POST) y el listado (GET) de propiedades.
    """

    def setUp(self):
        """
        Configura el entorno de prueba antes de la ejecución de cada test.
        Crea dos usuarios y propiedades para ambos para verificar el aislamiento de datos.
        """
        self.user_a = User.objects.create_user(username='user.a.prop.test@example.com', password='password123')
        self.user_b = User.objects.create_user(username='user.b.prop.test@example.com', password='password123')
        
        # Propiedades del Usuario A
        Property.objects.create(name='Propiedad 1 de A', address='Calle A-1', user=self.user_a)
        Property.objects.create(name='Propiedad 2 de A', address='Calle A-2', user=self.user_a)
        
        # Propiedad del Usuario B
        Property.objects.create(name='Propiedad 1 de B', address='Calle B-1', user=self.user_b)

        self.list_create_url = reverse('property-list-create')

    # --- Pruebas para la Creación de Propiedades (HU-05) ---

    def test_crear_propiedad_exitoso_para_usuario_autenticado(self):
        """
        Verifica que un usuario autenticado puede crear una nueva propiedad
        y que esta se asocia correctamente a su cuenta.
        """
        self.client.force_authenticate(user=self.user_a)
        data = {'name': 'Propiedad Nueva de A', 'address': 'Dirección Nueva'}
        
        response = self.client.post(self.list_create_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # El usuario A ahora debe tener 3 propiedades.
        self.assertEqual(Property.objects.filter(user=self.user_a).count(), 3)
        
        # Verifica que la última propiedad creada tiene los datos correctos.
        new_property = Property.objects.get(id=response.data['id'])
        self.assertEqual(new_property.name, 'Propiedad Nueva de A')
        self.assertEqual(new_property.user, self.user_a)

    def test_crear_propiedad_falla_sin_autenticacion(self):
        """
        Verifica que un usuario no autenticado (anónimo) no puede crear una propiedad.
        """
        data = {'name': 'Propiedad Fantasma', 'address': 'Calle Inexistente 404'}
        response = self.client.post(self.list_create_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_crear_propiedad_falla_con_datos_invalidos(self):
        """
        Verifica que la validación del backend rechaza datos incompletos (nombre vacío).
        """
        self.client.force_authenticate(user=self.user_a)
        data = {'name': '', 'address': 'Dirección sin nombre'}
        response = self.client.post(self.list_create_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # Asegura que no se haya creado ninguna propiedad nueva.
        self.assertEqual(Property.objects.count(), 3)

    # --- Pruebas para el Listado de Propiedades (HU-08) ---

    def test_listar_propiedades_exitoso_para_usuario_autenticado(self):
        """
        Verifica que el endpoint devuelve solo las propiedades del usuario autenticado
        y que los datos tienen el formato de resumen (sin campos anidados).
        """
        self.client.force_authenticate(user=self.user_a)
        response = self.client.get(self.list_create_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Debe haber 2 propiedades, solo las del usuario A.
        self.assertEqual(len(response.data), 2)
        
        # Verificar la estructura del primer objeto: solo campos de resumen.
        property_data = response.data[0]
        self.assertEqual(sorted(property_data.keys()), ['address', 'id', 'name'])
        self.assertNotIn('units', property_data)
        self.assertNotIn('user', property_data)

    def test_listar_propiedades_falla_sin_autenticacion_get(self):
        """
        Verifica que un usuario no autenticado recibe 401 Unauthorized al intentar listar.
        (Renombrado para evitar conflictos con la prueba de POST).
        """
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
    def test_listar_propiedades_devuelve_lista_vacia_para_usuario_sin_propiedades(self):
        """
        Verifica que un usuario autenticado sin propiedades recibe una lista vacía
        y un estado 200 OK.
        """
        user_c_sin_propiedades = User.objects.create_user(username='user.c.empty@example.com', password='password123')
        self.client.force_authenticate(user=user_c_sin_propiedades)
        
        response = self.client.get(self.list_create_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])