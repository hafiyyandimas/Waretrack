# Getting Started

# Install dependencies

```bash
npm install ## Installing dependencies
npm run build ## Building for production
```

# Setup (Database)
Create .env fles based on .env.example file, then run:
```bash
pnpm db:generate
pnpm db:push
pnpm db:studio  # Verify the connection
```

## Running The App
```bash
npm run dev
```

# Building For Production

To build this application for production:

```bash
npm run build
```

## Testing

This project uses [Vitest](https://vitest.dev/) for testing. You can run the tests with:

```bash
npm run test
```

# Database Tables Format
Queries used (PostgreSQL / Supabase):

```bash
create table public.pengguna (
  id_pengguna bigserial not null,
  role character varying not null,
  password_hash character varying not null,
  email character varying not null,
  nama_lengkap character varying not null,
  updated_at timestamp without time zone not null,
  created_at timestamp without time zone not null,
  token text,
  constraint pengguna_pkey primary key (id_pengguna)
) TABLESPACE pg_default;
```

```bash
create table public.audit_log (
  id_log bigint generated always as identity not null,
  id_pengguna bigint null,
  aksi character varying not null,
  created_at timestamp without time zone not null default now(),
  constraint audit_log_pkey primary key (id_log),
  constraint audit_log_id_pengguna_fkey foreign KEY (id_pengguna) references pengguna (id_pengguna)
) TABLESPACE pg_default;
```

```bash
create table public.barang (
  id_barang bigint generated always as identity not null,
  nama_barang character varying not null,
  sku character varying not null,
  kategori character varying null,
  satuan character varying not null,
  batas_minimum integer not null,
  harga bigint not null,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  constraint barang_pkey primary key (id_barang),
  constraint barang_sku_key unique (sku)
) TABLESPACE pg_default;
```
```bash
create table public.gudang (
  id_gudang bigint generated always as identity not null,
  nama_gudang character varying not null,
  constraint gudang_pkey primary key (id_gudang)
) TABLESPACE pg_default;
```
```bash
create table public.stok_gudang (
  id_stok_gudang bigint generated always as identity not null,
  id_barang bigint not null,
  id_gudang bigint not null,
  kuantitas_stok integer not null default 0,
  updated_at timestamp without time zone not null default now(),
  constraint stok_gudang_pkey primary key (id_stok_gudang),
  constraint stok_gudang_barang_fkey foreign KEY (id_barang) references barang (id_barang),
  constraint stok_gudang_gudang_fkey foreign KEY (id_gudang) references gudang (id_gudang)
) TABLESPACE pg_default;
```

```bash
create table public.transaksi (
  jumlah integer not null,
  id_pengguna bigint not null,
  id_barang bigint not null,
  id_transaksi bigint not null generated always as identity,
  keterangan text null,
  jenis_transaksi character varying not null,
  created_at timestamp without time zone not null,
  tanggal timestamp without time zone not null,
  id_gudang bigint null,
  constraint transaksi_pkey primary key (id_transaksi),
  constraint fk_transaksi_barang foreign KEY (id_barang) references barang (id_barang),
  constraint fk_transaksi_pengguna foreign KEY (id_pengguna) references pengguna (id_pengguna),
  constraint fk_transaksi_gudang foreign KEY (id_gudang) references gudang (id_gudang)
) TABLESPACE pg_default;
```

## Styling

This project uses [Tailwind CSS](https://tailwindcss.com/) for styling.

### Removing Tailwind CSS

If you prefer not to use Tailwind CSS:

1. Remove the demo pages in `src/routes/demo/`
2. Replace the Tailwind import in `src/styles.css` with your own styles
3. Remove `tailwindcss()` from the plugins array in `vite.config.ts`
4. Uninstall the packages: `npm install @tailwindcss/vite tailwindcss -D`

## Linting & Formatting


This project uses [eslint](https://eslint.org/) and [prettier](https://prettier.io/) for linting and formatting. Eslint is configured using [tanstack/eslint-config](https://tanstack.com/config/latest/docs/eslint). The following scripts are available:

```bash
npm run lint
npm run format
npm run check
```


## Shadcn

Add components using the latest version of [Shadcn](https://ui.shadcn.com/).

```bash
pnpm dlx shadcn@latest add button
```



## Routing

This project uses [TanStack Router](https://tanstack.com/router) with file-based routing. Routes are managed as files in `src/routes`.

### Adding A Route

To add a new route to your application just add a new file in the `./src/routes` directory.

TanStack will automatically generate the content of the route file for you.

Now that you have two routes you can use a `Link` component to navigate between them.

### Adding Links

To use SPA (Single Page Application) navigation you will need to import the `Link` component from `@tanstack/react-router`.

```tsx
import { Link } from "@tanstack/react-router";
```

Then anywhere in your JSX you can use it like so:

```tsx
<Link to="/about">About</Link>
```

This will create a link that will navigate to the `/about` route.

More information on the `Link` component can be found in the [Link documentation](https://tanstack.com/router/v1/docs/framework/react/api/router/linkComponent).

### Using A Layout

In the File Based Routing setup the layout is located in `src/routes/__root.tsx`. Anything you add to the root route will appear in all the routes. The route content will appear in the JSX where you render `{children}` in the `shellComponent`.

Here is an example layout that includes a header:

```tsx
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'My App' },
    ],
  }),
  shellComponent: ({ children }) => (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <header>
          <nav>
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
          </nav>
        </header>
        {children}
        <Scripts />
      </body>
    </html>
  ),
})
```

More information on layouts can be found in the [Layouts documentation](https://tanstack.com/router/latest/docs/framework/react/guide/routing-concepts#layouts).

## Server Functions

TanStack Start provides server functions that allow you to write server-side code that seamlessly integrates with your client components.

```tsx
import { createServerFn } from '@tanstack/react-start'

const getServerTime = createServerFn({
  method: 'GET',
}).handler(async () => {
  return new Date().toISOString()
})

// Use in a component
function MyComponent() {
  const [time, setTime] = useState('')
  
  useEffect(() => {
    getServerTime().then(setTime)
  }, [])
  
  return <div>Server time: {time}</div>
}
```

## API Routes

You can create API routes by using the `server` property in your route definitions:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'

export const Route = createFileRoute('/api/hello')({
  server: {
    handlers: {
      GET: () => json({ message: 'Hello, World!' }),
    },
  },
})
```

## Data Fetching

There are multiple ways to fetch data in your application. You can use TanStack Query to fetch data from a server. But you can also use the `loader` functionality built into TanStack Router to load the data for a route before it's rendered.

For example:

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/people')({
  loader: async () => {
    const response = await fetch('https://swapi.dev/api/people')
    return response.json()
  },
  component: PeopleComponent,
})

function PeopleComponent() {
  const data = Route.useLoaderData()
  return (
    <ul>
      {data.results.map((person) => (
        <li key={person.name}>{person.name}</li>
      ))}
    </ul>
  )
}
```

Loaders simplify your data fetching logic dramatically. Check out more information in the [Loader documentation](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#loader-parameters).

# Demo files

Files prefixed with `demo` can be safely deleted. They are there to provide a starting point for you to play around with the features you've installed.

# Learn More

You can learn more about all of the offerings from TanStack in the [TanStack documentation](https://tanstack.com).

For TanStack Start specific documentation, visit [TanStack Start](https://tanstack.com/start).
