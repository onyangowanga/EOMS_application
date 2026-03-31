from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tasks', '0003_task_event_task_progress_percentage'),
    ]

    operations = [
        migrations.AddField(
            model_name='task',
            name='estimated_cost',
            field=models.DecimalField(
                blank=True,
                decimal_places=2,
                help_text='Optional estimated cost for task execution',
                max_digits=12,
                null=True,
            ),
        ),
    ]
