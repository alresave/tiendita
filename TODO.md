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

## Entregado — 7 de agosto de 2026

- [x] Convertir las secciones del panel admin en vistas de trabajo completas para móvil, con navegación horizontal y vista activa persistente.
- [x] Adaptar el inventario administrativo a tarjetas móviles con controles táctiles de 44 px.
- [x] Añadir filtros de precio y disponibilidad, ordenamiento y paginación al catálogo.
- [x] Mejorar accesibilidad con foco visible, foco atrapado en capas y cierre con `Escape`.
- [x] Corregir invitaciones de administradores: CORS de producción, mensajes de error detallados y soporte para cuentas existentes.
- [x] Permitir que personas invitadas creen o restablezcan su contraseña desde la tienda.
- [x] Configurar la URL pública de Auth en Supabase y desplegar los cambios en `https://tiendita-aide.vercel.app`.

## Entregado — 15 de septiembre de 2026

- [x] Añadir CI en GitHub Actions para cada `push` y pull request.
- [x] Instalar dependencias con `npm ci` y ejecutar pruebas y build de producción como verificaciones independientes en CI.
- [x] Añadir `npm run test:ci` para ejecutar Vitest una sola vez, sin modo observación.
- [x] Añadir `npm run ci` como comprobación local de pruebas y build.
- [x] Documentar los comandos de verificación locales y de CI en el README.

## Siguiente ciclo sugerido

1. Ejecutar y documentar la validación funcional en producción: catálogo con imagen, carrito en incógnito, checkout, stock, correo, permisos no-admin y vistas móviles.
2. Marcar el workflow de CI como comprobación obligatoria para cambios a `main` en la configuración del repositorio de GitHub.
3. Configurar el dominio propio, limitar CORS a ese dominio y verificar el remitente de Resend.
4. Integrar pagos con un proveedor y procesar los webhooks firmados antes de aceptar pagos reales.

## Pendiente de validar en producción

- [ ] Crear una categoría y un producto con imagen subida a Supabase Storage.
- [ ] Probar el carrito desde una ventana de incógnito.
- [ ] Confirmar un checkout y verificar pedido, stock, carrito y correo al administrador.
- [ ] Probar el acceso con un usuario que no tenga el rol `admin`.
- [ ] Probar el checkout desde el sitio de producción publicado en Vercel.
- [ ] Validar visualmente la tienda publicada en móvil (320 px, 375 px y 768 px).

## Próxima entrega: checkout y pedidos

- [x] Capturar nombre, teléfono y dirección de envío en el checkout.
- [x] Guardar la dirección seleccionada en el pedido.
- [x] Mostrar detalle del pedido, productos, dirección y notas internas en administración.
- [x] Permitir actualizar el estado del pedido y notificar al cliente.

## Clientes

- [x] Crear perfil de cliente y gestión de direcciones guardadas.
- [x] Añadir historial de pedidos para clientes autenticados.
- [x] Completar la pantalla de creación y cambio de contraseña al volver desde invitación o recuperación.

## Catálogo e inventario

- [x] Activar o desactivar productos sin eliminarlos.
- [x] Añadir precio de oferta y precio anterior.
- [x] Mostrar alertas de stock bajo según el umbral del producto.
- [x] Registrar movimientos de inventario automáticamente para ajustes y ventas.
- [x] Mostrar movimientos de inventario en una vista administrativa dedicada.
- [x] Propagar el renombrado de una categoría a sus productos asociados.

## Operación y seguridad

- [x] Añadir límite de solicitudes al checkout.
- [x] Registrar cambios administrativos en la bitácora de auditoría.
- [ ] Configurar un dominio propio y restringir CORS a ese dominio.
- [ ] Configurar un remitente verificado de Resend con el dominio propio.
- [ ] Integrar un proveedor de pago y validar pagos con webhooks firmados.
