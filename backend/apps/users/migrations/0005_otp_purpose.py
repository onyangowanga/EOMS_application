from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0004_user_roles_jsonfield'),
    ]

    operations = [
        migrations.AddField(
            model_name='otp',
            name='purpose',
            field=models.CharField(
                choices=[('login', 'Login'), ('password_reset', 'Password Reset')],
                default='login',
                max_length=20,
            ),
        ),
    ]
