# Generated manually for email OTP support

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='otp',
            name='email',
            field=models.EmailField(blank=True, max_length=254, null=True),
        ),
        migrations.AlterField(
            model_name='otp',
            name='phone',
            field=models.CharField(blank=True, max_length=15, null=True),
        ),
    ]
