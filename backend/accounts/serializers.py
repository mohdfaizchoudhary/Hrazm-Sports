from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    phone = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'phone']

    def create(self, validated_data):
        phone = validated_data.pop('phone', '')
        password = validated_data.pop('password')
        
        # User create karein standard fields ke sath
        user = User.objects.create_user(**validated_data)
        user.set_password(password)

        # Phone field ko safely assign karein agar attribute exist karta ho
        user_fields = [f.name for f in User._meta.get_fields()]
        if 'phone' in user_fields and phone:
            user.phone = phone
        
        if 'is_staff' in user_fields:
            user.is_staff = False
        if 'is_superuser' in user_fields:
            user.is_superuser = False

        user.save()
        return user

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [f.name for f in User._meta.get_fields() if f.name in [
            'id', 'email', 'username', 'first_name', 'name', 'phone', 'is_staff', 'is_active'
        ]]


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, min_length=6)
    name = serializers.CharField(required=False, allow_blank=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    username = serializers.CharField(required=False, allow_blank=True)

    def validate_email(self, value):
        email = value.lower().strip()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("User with this email already exists.")
        return email


    def get_name(self, obj):
        if hasattr(obj, 'get_full_name') and obj.get_full_name():
            return obj.get_full_name()
        if hasattr(obj, 'first_name') and obj.first_name:
            return f"{obj.first_name} {getattr(obj, 'last_name', '')}".strip()
        if hasattr(obj, 'name') and obj.name:
            return obj.name
        return obj.email.split('@')[0]