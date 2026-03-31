from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_add_username_field'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='roles',
            field=models.JSONField(blank=True, default=list),
        ),
    ]