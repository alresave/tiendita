# Próximos pasos — Aidé storefront

## Entregado — 6 de agosto de 2026

- [x] Añadir temas públicos configurables desde el panel admin: Clásico, Océano, Medianoche y Blossom.
- [x] Persistir el tema elegido en Supabase y aplicarlo a toda la tienda.
- [x] Replantear categorías como departamentos, con tarjetas, estado activo y contador de productos.
- [x] Añadir marcas a productos y mini tiendas automáticas por marca.
- [x] Crear mini tiendas manuales: los admins pueden crear colecciones, describirlas y asignar productos individualmente.
- [x] Aplicar las migraciones de temas, marcas y mini tiendas manuales en Supabase.
- [x] Configurar las credenciales públicas de Supabase para el build de producción.
- [x] Mejorar la adaptación móvil de navegación, departamentos, filtros, panel admin, pie y notificaciones.
- [x] Validar los cambios con chequeo de tipos, pruebas unitarias y build de producción.

## Validar antes de desplegar

- [ ] Crear una categoría y un producto con imagen subida a Supabase Storage.
- [ ] Probar el carrito desde una ventana de incógnito.
- [ ] Confirmar un checkout y verificar pedido, stock, carrito y correo al administrador.
- [ ] Probar el acceso con un usuario que no tenga el rol `admin`.
- [ ] Desplegar un preview en Vercel y probar el checkout desde `*.vercel.app`.
- [ ] Validar visualmente la tienda publicada en móvil (320 px, 375 px y 768 px).

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
