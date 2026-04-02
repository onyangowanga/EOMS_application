from django.contrib.auth import get_user_model

User = get_user_model()
phone = '+254726953346'
full_name = 'Philwanga'
password = 'Eoms@0722!'

user, created = User.objects.get_or_create(
    phone=phone,
    defaults={
        'full_name': full_name,
        'is_staff': True,
        'is_superuser': True,
        'is_active': True,
        'role': 'ADMIN',
    },
)

user.full_name = full_name
user.is_staff = True
user.is_superuser = True
user.is_active = True
user.role = 'ADMIN'
user.set_password(password)
user.save()

print('CREATED' if created else 'UPDATED')
print(user.phone)
print(user.full_name)
print(user.is_staff, user.is_superuser, user.is_active, user.role)
