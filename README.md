# Pereira es Salsa

Sitio editorial y agenda local de Pereira es Salsa. No requiere compilación.

## Vista local

```bash
python3 -m http.server 8080
```

Abrir `http://localhost:8080`.

## Actualizar la agenda

Editar `content/events.json`. El workflow valida los datos y genera
automáticamente `data/events.json`, `/eventos/`, `/archivo-eventos/` y el
`sitemap.xml`. Ejemplo mínimo:

```json
[
  {
    "slug": "nombre-del-evento-2026",
    "name": "Nombre del evento",
    "status": "verified",
    "startDate": "2026-09-12T20:00:00-05:00",
    "description": "Descripción verificable del evento.",
    "venue": {
      "name": "Nombre del lugar",
      "address": "Dirección",
      "city": "Pereira",
      "region": "Risaralda"
    },
    "officialUrl": "https://enlace-oficial.example",
    "source": {
      "url": "https://fuente-de-verificacion.example",
      "verifiedAt": "2026-08-23T12:00:00-05:00"
    }
  }
]
```

Estados permitidos: `draft`, `verified`, `postponed` y `cancelled`. Los borradores
no se publican. No publicar información sin verificarla con una fuente oficial.

Ejecutar antes de cada commit:

```bash
node scripts/test-events.mjs
node scripts/build-events.mjs
```

## Publicación: GitHub + Namecheap

GitHub conserva el historial y la fuente del proyecto. El sitio público se sirve
desde el document root asignado al dominio en el hosting Apache/LiteSpeed de
Namecheap.

DNS en cPanel:

| Tipo | Nombre | Destino |
|---|---|---|
| A | pereiraessalsa.com | 63.250.38.18 |
| CNAME | www.pereiraessalsa.com | pereiraessalsa.com |

No modificar los registros MX/TXT ni los subdominios de correo. Para desplegar,
comprimir los archivos públicos —sin `.git`—, subir el ZIP al document root y
extraerlo aceptando la sustitución de archivos. Conservar un ZIP recuperable de
la versión anterior fuera del document root.

### Despliegue automatizado

El workflow `Deploy to Namecheap` publica automáticamente cuando cambian
archivos del sitio en la rama `main`. También puede ejecutarse manualmente desde
la pestaña **Actions**. Requiere un environment de GitHub llamado `production`
y estos secretos:

- `FTP_SERVER`
- `FTP_USERNAME`
- `FTP_PASSWORD`
- `FTP_SERVER_DIR`

El modo manual permite usar `dry_run: true` para revisar cambios sin tocar el
servidor. El workflow usa FTPS, no elimina el directorio remoto completo y
ejecuta pruebas públicas después de cada despliegue real.
