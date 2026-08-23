# Plantilla operativa: sitio editorial estático con GitHub y Namecheap

## Resultado buscado

Usar este patrón para nuevos portales editoriales que necesiten actualizaciones
frecuentes sin incorporar todavía un CMS:

```text
Edición local → commit en main → GitHub Actions → FTPS → Namecheap
                                              → smoke tests públicos
```

- **GitHub** conserva código, historial y workflow.
- **Namecheap/cPanel** sirve el dominio, HTTPS y archivos públicos.
- **Una cuenta FTP dedicada** solo puede acceder al document root del sitio.
- **GitHub Environment Secrets** guarda las credenciales cifradas.

No usar GitHub Pages para esta variante. El dominio debe permanecer en el
hosting de Namecheap.

## Estructura mínima

```text
.
├── .github/workflows/deploy-namecheap.yml
├── .htaccess
├── 404.html
├── app.js
├── assets/images/
├── data/events.json
├── index.html
├── publicar-evento.html
├── robots.txt
├── sitemap.xml
└── styles.css
```

La agenda consume `data/events.json`. Solo se muestran eventos futuros con
`status: "verified"`. Nunca publicar información sin fuente oficial.

## Prerrequisitos

- Dominio y hosting activo en Namecheap.
- Repositorio GitHub sin secretos en archivos versionados.
- Document root independiente para el dominio.
- HTTPS válido en Namecheap.
- Respaldo ZIP recuperable de la versión anterior.
- Acceso a cPanel para crear una cuenta FTP restringida.

## DNS en Namecheap

Con **Web Hosting DNS**, administrar la zona desde:

```text
cPanel → Zone Editor → dominio → Manage
```

Patrón:

| Tipo | Nombre | Destino |
|---|---|---|
| A | dominio raíz | IP asignada por Namecheap |
| CNAME | www | dominio raíz |

No tocar registros `MX`, `TXT`, DKIM, SPF, DMARC ni subdominios de correo. No
cambiar a BasicDNS sin inventariar y recrear previamente toda la zona.

## Cuenta FTP dedicada

En `cPanel → FTP Accounts`:

1. Crear un usuario como `github-deploy@dominio`.
2. Generar una contraseña única y fuerte.
3. Restringir **Directory** al document root exacto del dominio.
4. Usar cuota ilimitada o una cuota suficiente.
5. No almacenar la contraseña principal de cPanel en GitHub.

Al estar restringida al document root, la cuenta ve esa carpeta como `./`.

## Secretos del environment `production`

Crear en:

```text
Repository → Settings → Environments → production → Environment secrets
```

| Secreto | Contenido |
|---|---|
| `FTP_SERVER` | Host FTPS del servidor |
| `FTP_USERNAME` | Cuenta FTP dedicada completa |
| `FTP_PASSWORD` | Contraseña única de esa cuenta |
| `FTP_SERVER_DIR` | `./` para una cuenta restringida al document root |

Nunca escribir estos valores en YAML, README, commits, capturas o mensajes.

## Gate del primer despliegue

1. Publicar el workflow solo con `workflow_dispatch`.
2. Ejecutarlo con `dry_run: true`.
3. Exigir:
   - conexión FTPS válida;
   - certificado aceptado con `security: strict`;
   - directorio remoto correcto;
   - cero eliminaciones inesperadas;
   - exclusión de `.git`, `.github`, README, ZIP y dependencias.
4. Ejecutar una vez con `dry_run: false`.
5. Verificar portada, `robots.txt` y `sitemap.xml`.
6. Solo después habilitar `push` para archivos públicos en `main`.

## Despliegue habitual

1. Modificar contenido o recursos.
2. Validar localmente sintaxis, rutas y datos.
3. Hacer commit y push a `main`.
4. GitHub Actions sincroniza únicamente diferencias por FTPS.
5. El workflow ejecuta smoke tests públicos.
6. Confirmar que el run termine en `success`.

Los cambios en README o archivos administrativos no deben activar producción.

## Rollback

Activar rollback si falla la portada, desaparecen imágenes principales,
`robots.txt`/`sitemap.xml` dejan de responder o el workflow elimina archivos no
previstos.

Opciones, en este orden:

1. Revertir el commit defectuoso y hacer push a `main`.
2. Ejecutar manualmente el workflow con el commit corregido.
3. Si FTPS falla, restaurar el ZIP anterior mediante File Manager.
4. Confirmar HTTPS y los flujos críticos después de restaurar.

Nunca usar limpieza total del directorio remoto (`dangerous-clean-slate`).

## Lecciones aprendidas

- La carpeta local puede estar vacía aunque exista una web en producción; antes
  de editar, recuperar recursos o confirmar dónde está la fuente original.
- GitHub Pages puede atascar la emisión del certificado aun con DNS correcto.
  Para sitios ya alojados en Namecheap, GitHub + FTPS reduce cambios de DNS.
- Web Hosting DNS se gestiona en cPanel, no en Advanced DNS de Namecheap.
- Un `dry-run` sin archivo de estado puede reportar `Server Files: 0`; revisar
  especialmente el total de eliminaciones antes del primer envío real.
- Crear siempre una cuenta FTP dedicada, no usar la contraseña maestra.
- Mantener el respaldo fuera del document root y probar que el ZIP sea legible.

## Checklist para replicar en otro portal

- [ ] Crear repositorio y estructura estática.
- [ ] Añadir canonical, Open Graph, JSON-LD, robots y sitemap.
- [ ] Validar enlaces, imágenes, accesibilidad y página 404.
- [ ] Confirmar DNS/HTTPS actuales antes de cambiarlos.
- [ ] Respaldar producción.
- [ ] Crear cuenta FTP limitada.
- [ ] Crear environment y cuatro secretos.
- [ ] Ejecutar dry-run sin eliminaciones.
- [ ] Ejecutar primer despliegue manual y smoke tests.
- [ ] Habilitar despliegue automático selectivo desde `main`.
- [ ] Documentar rollback y responsable editorial.
