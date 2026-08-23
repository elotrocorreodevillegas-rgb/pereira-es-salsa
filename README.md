# Pereira es Salsa

Sitio editorial y agenda local de Pereira es Salsa. No requiere compilación.

## Vista local

```bash
python3 -m http.server 8080
```

Abrir `http://localhost:8080`.

## Actualizar la agenda

Editar `data/events.json`. Solo se muestran registros futuros con `status: "verified"`:

```json
[
  {
    "name": "Nombre del evento",
    "date": "2026-09-12",
    "venue": "Nombre del lugar",
    "city": "Pereira",
    "url": "https://enlace-oficial.example",
    "status": "verified"
  }
]
```

No publicar información sin verificarla con una fuente oficial. Después de agregar páginas, actualizar `sitemap.xml`.

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

El workflow `Deploy to Namecheap` se ejecuta manualmente desde la pestaña
**Actions**. Requiere un environment de GitHub llamado `production` y estos
secretos:

- `FTP_SERVER`
- `FTP_USERNAME`
- `FTP_PASSWORD`
- `FTP_SERVER_DIR`

La primera ejecución debe conservar `dry_run: true`. Solo después de revisar el
listado de cambios se ejecuta con `dry_run: false`. El workflow usa FTPS, no
elimina el directorio remoto completo y ejecuta pruebas públicas después de un
despliegue real.
