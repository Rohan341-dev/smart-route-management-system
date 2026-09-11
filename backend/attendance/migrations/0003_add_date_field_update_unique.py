from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('attendance', '0002_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='attendancerecord',
            name='date',
            field=models.DateField(blank=True, help_text='Date of attendance', null=True),
        ),
        migrations.AddField(
            model_name='attendancerecord',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AlterField(
            model_name='attendancerecord',
            name='driver',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.SET_NULL,
                related_name='attendance_records',
                to='accounts.user',
            ),
        ),
        migrations.AlterUniqueTogether(
            name='attendancerecord',
            unique_together={('student', 'bus', 'trip_stage', 'date')},
        ),
    ]
