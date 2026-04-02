from django.contrib.auth import get_user_model

User = get_user_model()
user = User.objects.get(phone='+254726953346')
print(user.phone)
print(user.full_name)
print(user.is_staff)
print(user.is_superuser)
print(user.is_active)
print(user.role)
