# Generated by Django 5.2.4 on 2025-07-20 13:49

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('properties', '0003_billingcycle'),
    ]

    operations = [
        migrations.CreateModel(
            name='Expense',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('service_type', models.CharField(help_text='El tipo de servicio del gasto (ej. electricity, water).', max_length=50)),
                ('total_amount', models.DecimalField(decimal_places=2, help_text='El monto total del gasto.', max_digits=10)),
                ('invoice_pdf', models.FileField(help_text='El archivo PDF de la factura original.', upload_to='invoices/')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('billing_cycle', models.ForeignKey(help_text='El ciclo de facturación al que pertenece este gasto.', on_delete=django.db.models.deletion.CASCADE, related_name='expenses', to='properties.billingcycle')),
            ],
            options={
                'verbose_name': 'Expense',
                'verbose_name_plural': 'Expenses',
                'ordering': ['-created_at'],
            },
        ),
    ]
