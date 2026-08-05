# Aidé storefront

## Administración

El área administrativa usa Supabase Auth y solo permite gestionar productos a
usuarios con el rol `admin`. Configura `supabaseUrl` y `supabaseKey` en
`src/environments/environment.ts`, ejecuta `supabase/schema.sql` en el SQL
Editor de Supabase y crea el usuario administrador en **Authentication > Users**.

Después, asígnale el rol desde el SQL Editor:

```sql
insert into public.user_roles (user_id, role)
values ('UUID_DEL_USUARIO', 'admin')
on conflict (user_id) do update set role = excluded.role;
```

No hay acceso de demostración: los cambios de productos solo se realizan si la
sesión autenticada tiene ese rol y las políticas RLS de Supabase lo confirman.

Para producción, completa `src/environments/environment.prod.ts` con la Project
URL y la Publishable/anon key. La `service_role` no debe incluirse en Angular.

Para una base ya creada, aplica primero
`supabase/migrations/20260805160000_store_management.sql` en el SQL Editor.
Después despliega de nuevo `supabase/functions/checkout`, ya que ahora registra
el pedido y sus productos además de descontar el inventario.

La migración `20260805170000_secure_carts_and_atomic_checkout.sql` protege los
carritos por sesión y añade el checkout atómico. Aplícala antes de desplegar la
versión más reciente de la función `checkout`.

La migración `20260805200000_admin_invites_and_storefront_content.sql` habilita
el contenido editable de inicio. Después de aplicarla, despliega la función
`invite-admin`; así los administradores pueden invitar a otros administradores
desde el panel sin exponer la clave `service_role` en el navegador.

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.0.7.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
