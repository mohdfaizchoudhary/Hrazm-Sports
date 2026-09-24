from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [('orders', '0003_order_return_reason_order_return_requested_at_and_more')]

    operations = [
        migrations.AddField(
            model_name='order', name='replacement_product',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='replacement_orders', to='products.product'),
        ),
        migrations.AddField(model_name='order', name='original_product_name', field=models.CharField(blank=True, max_length=255, null=True)),
        migrations.AddField(model_name='order', name='replacement_product_name', field=models.CharField(blank=True, max_length=255, null=True)),
        migrations.AddField(model_name='order', name='replacement_diff_amount', field=models.DecimalField(decimal_places=2, default=0, max_digits=10)),
        migrations.AddField(model_name='order', name='replacement_payment_status', field=models.CharField(default='NONE', max_length=20)),
    ]