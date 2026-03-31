from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tasks', '0004_task_estimated_cost'),
        ('events', '0005_alter_eventmember_role'),
    ]

    operations = [
        migrations.AddField(
            model_name='budgetitem',
            name='linked_task',
            field=models.ForeignKey(
                blank=True,
                help_text='Task this budget line was generated from',
                null=True,
                on_delete=models.SET_NULL,
                related_name='budget_items',
                to='tasks.task',
            ),
        ),
    ]
