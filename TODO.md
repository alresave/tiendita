# Próximos pasos — Aidé storefront

## Validar antes de desplegar

- [ ] Crear una categoría y un producto con imagen subida a Supabase Storage.
- [ ] Probar el carrito desde una ventana de incógnito.
- [ ] Confirmar un checkout y verificar pedido, stock, carrito y correo al administrador.
- [ ] Probar el acceso con un usuario que no tenga el rol `admin`.
- [ ] Desplegar un preview en Vercel y probar el checkout desde `*.vercel.app`.

## Próxima entrega: checkout y pedidos

- [ ] Capturar nombre, teléfono y dirección de envío en el checkout.
- [ ] Guardar la dirección seleccionada en el pedido.
- [ ] Mostrar detalle del pedido, productos, dirección y notas internas en administración.
- [ ] Permitir actualizar el estado del pedido y notificar al cliente.

## Clientes

- [ ] Crear perfil de cliente y gestión de direcciones guardadas.
- [ ] Añadir historial de pedidos para clientes autenticados.
- [ ] Completar la pantalla de cambio de contraseña al volver desde el correo de recuperación.

## Catálogo e inventario

- [ ] Activar o desactivar productos sin eliminarlos.
- [ ] Añadir precio de oferta y precio anterior.
- [ ] Mostrar alertas de stock bajo según el umbral del producto.
- [ ] Registrar y mostrar movimientos de inventario.
- [ ] Propagar el renombrado de una categoría a sus productos asociados.

## Operación y seguridad

- [ ] Añadir límite de solicitudes al checkout.
- [ ] Registrar cambios administrativos en la bitácora de auditoría.
- [ ] Configurar un dominio propio y restringir CORS a ese dominio.
- [ ] Configurar un remitente verificado de Resend con el dominio propio.
- [ ] Integrar un proveedor de pago y validar pagos con webhooks firmados.
