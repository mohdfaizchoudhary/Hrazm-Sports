from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model
from django.conf import settings
from .serializers import RegisterSerializer, UserSerializer

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        # Frontend payload se full name aur details extract karein
        name = request.data.get('first_name', '') or request.data.get('name', '').strip()
        data = request.data.copy()
        
        # Agar serializer specific name field expect kare
        if name and 'first_name' not in data:
            data['first_name'] = name

        serializer = self.get_serializer(data=data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = serializer.save()

            # Ensure user is standard customer (not staff/superuser)
            user_fields = [f.name for f in User._meta.get_fields()]
            updated = False

            if 'is_staff' in user_fields and user.is_staff:
                user.is_staff = False
                updated = True

            if 'is_superuser' in user_fields and user.is_superuser:
                user.is_superuser = False
                updated = True

            # Save full name if missing
            if name:
                if 'first_name' in user_fields and not user.first_name:
                    user.first_name = name
                    updated = True
                if 'name' in user_fields and hasattr(user, 'name') and not getattr(user, 'name'):
                    setattr(user, 'name', name)
                    updated = True

            if updated:
                user.save()

            refresh = RefreshToken.for_user(user)
            user_data = UserSerializer(user).data

            return Response({
                'user': user_data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                },
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'detail': f'Registration failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').lower().strip()
        password = request.data.get('password', '').strip()

        if not email or not password:
            return Response({'detail': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(request, username=email, password=password)
        
        if not user:
            try:
                user_obj = User.objects.get(email__iexact=email)
                if user_obj.check_password(password):
                    user = user_obj
            except User.DoesNotExist:
                try:
                    user_obj = User.objects.get(username__iexact=email)
                    if user_obj.check_password(password):
                        user = user_obj
                except User.DoesNotExist:
                    user = None

        if user is not None:
            if not user.is_active:
                return Response({'detail': 'This account has been deactivated.'}, status=status.HTTP_401_UNAUTHORIZED)
            
            refresh = RefreshToken.for_user(user)
            user_data = UserSerializer(user).data
            return Response({
                'user': user_data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                },
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }, status=status.HTTP_200_OK)

        return Response({'detail': 'Invalid email/username or password.'}, status=status.HTTP_401_UNAUTHORIZED)

class GoogleAuthView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({'detail': 'Token is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from google.oauth2 import id_token
            from google.auth.transport import requests

            idinfo = id_token.verify_oauth2_token(
                token, 
                requests.Request(), 
                audience=getattr(settings, 'GOOGLE_CLIENT_ID', None)
            )

            email = idinfo.get('email', '').lower().strip()
            first_name = idinfo.get('given_name', '')
            last_name = idinfo.get('family_name', '')
            full_name = f"{first_name} {last_name}".strip()

            if not email:
                return Response({'detail': 'Unable to retrieve email from Google.'}, status=status.HTTP_400_BAD_REQUEST)

            create_defaults = {'is_active': True, 'is_staff': False, 'is_superuser': False}
            user_fields = [f.name for f in User._meta.get_fields()]
            if 'first_name' in user_fields:
                create_defaults['first_name'] = first_name
            if 'last_name' in user_fields:
                create_defaults['last_name'] = last_name
            if 'name' in user_fields and full_name:
                create_defaults['name'] = full_name
            if 'username' in user_fields:
                create_defaults['username'] = email

            user, _ = User.objects.get_or_create(email=email, defaults=create_defaults)

            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                },
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'detail': f'Google authentication error: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)



from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model
from django.conf import settings
from .serializers import RegisterSerializer, UserSerializer
import traceback

User = get_user_model()

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        email = data.get('email', '').lower().strip()
        password = data.get('password')
        full_name = data.get('name') or data.get('first_name') or ''
        phone = data.get('phone', '').strip()
        raw_username = data.get('username') or email.split('@')[0]

        try:
            user_fields = [f.name for f in User._meta.get_fields()]

            # Extra fields dictionary build karein model ke according
            extra_fields = {}

            if 'first_name' in user_fields and full_name:
                extra_fields['first_name'] = full_name
            if 'name' in user_fields and full_name:
                extra_fields['name'] = full_name
            if 'phone' in user_fields and phone:
                extra_fields['phone'] = phone
            if 'is_staff' in user_fields:
                extra_fields['is_staff'] = False
            if 'is_superuser' in user_fields:
                extra_fields['is_superuser'] = False
            if 'is_active' in user_fields:
                extra_fields['is_active'] = True

            # Username handling (agar model me username field exist karti ho)
            if 'username' in user_fields:
                unique_username = raw_username
                counter = 1
                while User.objects.filter(username=unique_username).exists():
                    unique_username = f"{raw_username}{counter}"
                    counter += 1
                extra_fields['username'] = unique_username

            # Safe user creation
            if hasattr(User.objects, 'create_user'):
                user = User.objects.create_user(email=email, password=password, **extra_fields)
            else:
                user = User(email=email, **extra_fields)
                user.set_password(password)
                user.save()

            # Tokens generate karein
            refresh = RefreshToken.for_user(user)
            user_data = UserSerializer(user).data

            return Response({
                'user': user_data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                },
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            traceback.print_exc()
            return Response({'detail': f'Registration failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').lower().strip()
        password = request.data.get('password', '').strip()

        if not email or not password:
            return Response({'detail': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(request, username=email, password=password)
        
        if not user:
            try:
                user_obj = User.objects.get(email__iexact=email)
                if user_obj.check_password(password):
                    user = user_obj
            except User.DoesNotExist:
                try:
                    user_obj = User.objects.get(username__iexact=email)
                    if user_obj.check_password(password):
                        user = user_obj
                except User.DoesNotExist:
                    user = None

        if user is not None:
            if not user.is_active:
                return Response({'detail': 'This account has been deactivated.'}, status=status.HTTP_401_UNAUTHORIZED)
            
            refresh = RefreshToken.for_user(user)
            user_data = UserSerializer(user).data
            return Response({
                'user': user_data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                },
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }, status=status.HTTP_200_OK)

        return Response({'detail': 'Invalid email/username or password.'}, status=status.HTTP_401_UNAUTHORIZED)

class GoogleAuthView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({'detail': 'Token is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from google.oauth2 import id_token
            from google.auth.transport import requests

            idinfo = id_token.verify_oauth2_token(
                token, 
                requests.Request(), 
                audience=getattr(settings, 'GOOGLE_CLIENT_ID', None)
            )

            email = idinfo.get('email', '').lower().strip()
            first_name = idinfo.get('given_name', '')
            last_name = idinfo.get('family_name', '')
            full_name = f"{first_name} {last_name}".strip()

            if not email:
                return Response({'detail': 'Unable to retrieve email from Google.'}, status=status.HTTP_400_BAD_REQUEST)

            create_defaults = {'is_active': True, 'is_staff': False, 'is_superuser': False}
            user_fields = [f.name for f in User._meta.get_fields()]
            if 'first_name' in user_fields:
                create_defaults['first_name'] = first_name
            if 'last_name' in user_fields:
                create_defaults['last_name'] = last_name
            if 'name' in user_fields and full_name:
                create_defaults['name'] = full_name
            if 'username' in user_fields:
                create_defaults['username'] = email

            user, _ = User.objects.get_or_create(email=email, defaults=create_defaults)

            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                },
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'detail': f'Google authentication error: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)