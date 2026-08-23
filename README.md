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

## Publicación recomendada: GitHub Pages + dominio en Namecheap

GitHub Pages publica el contenido de la rama `main`. El archivo `CNAME` fija
`www.pereiraessalsa.com` como dominio principal y `.nojekyll` sirve los archivos
estáticos sin procesamiento adicional.

### DNS en Namecheap

En **Domain List > Manage > Advanced DNS**, eliminar únicamente los registros
conflictivos de `@` y `www` y configurar:

| Tipo | Host | Valor | TTL |
|---|---|---|---|
| A | @ | 185.199.108.153 | Automatic |
| A | @ | 185.199.109.153 | Automatic |
| A | @ | 185.199.110.153 | Automatic |
| A | @ | 185.199.111.153 | Automatic |
| CNAME | www | elotrocorreodevillegas-rgb.github.io | Automatic |

No modificar registros MX/TXT usados por correo. Después de la propagación,
activar **Enforce HTTPS** en **GitHub > Settings > Pages**.

### Configuración del repositorio

1. Crear un repositorio público llamado `pereira-es-salsa`.
2. Subir la rama `main`.
3. Ir a **Settings > Pages**.
4. En **Build and deployment**, elegir `Deploy from a branch`.
5. Seleccionar `main` y `/ (root)`.
6. Confirmar `www.pereiraessalsa.com` como dominio personalizado.

El archivo `.htaccess` solo se utiliza si el sitio se aloja directamente en
Apache/LiteSpeed; GitHub Pages lo ignora. La redirección entre el dominio raíz y
`www` la administra Pages cuando ambos registros DNS están configurados.
