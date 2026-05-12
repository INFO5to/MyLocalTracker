$ErrorActionPreference = "Stop"

$root = Resolve-Path "."
$outDir = Join-Path $root "docs"
$buildDir = Join-Path $root ".docx-build-stage2"
$outFile = Join-Path $outDir "LocalTracker_Metodologia_Scrum_Etapa_2.docx"

if (Test-Path $buildDir) {
  Remove-Item -LiteralPath $buildDir -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $buildDir | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $buildDir "_rels") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $buildDir "docProps") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $buildDir "word") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $buildDir "word\_rels") | Out-Null

function XmlEscape([string]$text) {
  if ($null -eq $text) { return "" }
  return [System.Security.SecurityElement]::Escape($text)
}

function Para {
  param(
    [string]$Text,
    [string]$Style = "Normal",
    [switch]$Bold,
    [string]$Color = "",
    [int]$Size = 22
  )

  $styleXml = if ($Style -ne "Normal") { "<w:pPr><w:pStyle w:val=`"$Style`"/></w:pPr>" } else { "" }
  $boldXml = if ($Bold) { "<w:b/>" } else { "" }
  $colorXml = if ($Color) { "<w:color w:val=`"$Color`"/>" } else { "" }
  $textEscaped = XmlEscape $Text
  return "<w:p>$styleXml<w:r><w:rPr>$boldXml$colorXml<w:sz w:val=`"$Size`"/></w:rPr><w:t xml:space=`"preserve`">$textEscaped</w:t></w:r></w:p>"
}

function Spacer {
  param([int]$After = 160)
  return "<w:p><w:pPr><w:spacing w:after=`"$After`"/></w:pPr></w:p>"
}

function Cell {
  param(
    [string]$Text,
    [int]$Width = 2500,
    [switch]$Header
  )

  $fill = if ($Header) { "<w:shd w:fill=`"2B2B32`"/>" } else { "<w:shd w:fill=`"FFFFFF`"/>" }
  $bold = if ($Header) { "<w:b/>" } else { "" }
  $color = if ($Header) { "<w:color w:val=`"FFFFFF`"/>" } else { "<w:color w:val=`"2B1D24`"/>" }
  $textEscaped = XmlEscape $Text
  return @"
<w:tc>
  <w:tcPr>
    <w:tcW w:w="$Width" w:type="dxa"/>
    <w:tcMar><w:top w:w="140" w:type="dxa"/><w:left w:w="140" w:type="dxa"/><w:bottom w:w="140" w:type="dxa"/><w:right w:w="140" w:type="dxa"/></w:tcMar>
    $fill
  </w:tcPr>
  <w:p>
    <w:r><w:rPr>$bold$color<w:sz w:val="19"/></w:rPr><w:t xml:space="preserve">$textEscaped</w:t></w:r>
  </w:p>
</w:tc>
"@
}

function Row {
  param([string[]]$Values, [int[]]$Widths, [switch]$Header)

  $cells = New-Object System.Collections.Generic.List[string]
  for ($i = 0; $i -lt $Values.Count; $i++) {
    $cells.Add((Cell -Text $Values[$i] -Width $Widths[$i] -Header:$Header))
  }
  return "<w:tr>$($cells -join '')</w:tr>"
}

function Table {
  param(
    [string[]]$Headers,
    [object[]]$Rows,
    [int[]]$Widths
  )

  $body = New-Object System.Collections.Generic.List[string]
  $body.Add((Row -Values $Headers -Widths $Widths -Header))
  foreach ($entry in $Rows) {
    $body.Add((Row -Values $entry -Widths $Widths))
  }

  return @"
<w:tbl>
  <w:tblPr>
    <w:tblW w:w="0" w:type="auto"/>
    <w:tblBorders>
      <w:top w:val="single" w:sz="6" w:space="0" w:color="E9DDE3"/>
      <w:left w:val="single" w:sz="6" w:space="0" w:color="E9DDE3"/>
      <w:bottom w:val="single" w:sz="6" w:space="0" w:color="E9DDE3"/>
      <w:right w:val="single" w:sz="6" w:space="0" w:color="E9DDE3"/>
      <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E9DDE3"/>
      <w:insideV w:val="single" w:sz="4" w:space="0" w:color="E9DDE3"/>
    </w:tblBorders>
    <w:tblCellMar><w:top w:w="120" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tblCellMar>
  </w:tblPr>
  $($body -join "`n")
</w:tbl>
"@
}

function Callout {
  param([string]$Title, [string]$Body)
  return @"
<w:tbl>
  <w:tblPr>
    <w:tblW w:w="9360" w:type="dxa"/>
    <w:tblBorders>
      <w:top w:val="single" w:sz="8" w:color="F3B1BE"/>
      <w:left w:val="single" w:sz="8" w:color="F3B1BE"/>
      <w:bottom w:val="single" w:sz="8" w:color="F3B1BE"/>
      <w:right w:val="single" w:sz="8" w:color="F3B1BE"/>
    </w:tblBorders>
  </w:tblPr>
  <w:tr>
    <w:tc>
      <w:tcPr><w:tcW w:w="9360" w:type="dxa"/><w:shd w:fill="FFF2F5"/><w:tcMar><w:top w:w="220" w:type="dxa"/><w:left w:w="260" w:type="dxa"/><w:bottom w:w="220" w:type="dxa"/><w:right w:w="260" w:type="dxa"/></w:tcMar></w:tcPr>
      $(Para -Text $Title -Style "CalloutTitle" -Bold -Color "9F324D" -Size 22)
      $(Para -Text $Body -Size 20)
    </w:tc>
  </w:tr>
</w:tbl>
"@
}

$sprintRows = @(
  @("Sprint 2.1", "Base operativa real", "Crear pedidos reales, eventos y dashboard conectado a Supabase.", "Pedidos, eventos, dashboard, estados iniciales.", "Pedido visible en dashboard y evento inicial registrado."),
  @("Sprint 2.2", "Tracking en vivo", "Mostrar movimiento del pedido con coordenadas reales.", "Tabla courier_locations, mapa Leaflet, vista publica, vista repartidor.", "Mapa actualiza posicion del repartidor desde el celular."),
  @("Sprint 2.3", "Comunicacion al cliente", "Enviar o preparar enlace de tracking para el cliente.", "Prueba Twilio, deteccion de limite sandbox, flujo manual WhatsApp.", "Mensaje/link listo para compartir sin depender del limite trial."),
  @("Sprint 2.4", "Despliegue publico", "Sacar la app de red local y probarla en URL real.", "GitHub, Vercel, variables de entorno, URL publica.", "Tracking abre desde celular en otra red."),
  @("Sprint 2.5", "Seguridad y roles", "Separar accesos internos y vista cliente.", "Login, profiles, roles owner/staff/driver, tokens publicos.", "Cliente solo ve su pedido; panel interno protegido."),
  @("Sprint 2.6", "UX y modulos", "Convertir la interfaz en experiencia de app.", "Modo claro/oscuro, pedidos, repartidores, historial, vista ejecutiva.", "Navegacion por modulos y menor contaminacion visual."),
  @("Sprint 2.7", "Estabilizacion", "Eliminar maqueta y robustecer flujo del repartidor.", "Tracking automatico cada 5s en En camino, boton manual de respaldo.", "Repartidor no depende de iniciar tracking manualmente.")
)

$functionalTests = @(
  @("PF-01", "Crear pedido desde dashboard", "Capturar cliente, telefono, direccion, items, total, ETA y repartidor.", "Pedido guardado en Supabase con codigo LT y evento inicial.", "Aprobado"),
  @("PF-02", "Avanzar estados", "Mover pedido por pendiente, confirmado, preparando, listo, en camino y entregado.", "El estado cambia y se registra evento en timeline.", "Aprobado"),
  @("PF-03", "Asignar repartidor", "Seleccionar repartidor activo al crear o editar el pedido.", "El pedido muestra nombre, vehiculo y acceso a vista repartidor.", "Aprobado"),
  @("PF-04", "Historial del turno", "Mover pedidos a entregado y revisar historial separado.", "Pedidos cerrados no contaminan tablero activo.", "Aprobado")
)

$trackingTests = @(
  @("TR-01", "Mapa publico", "Abrir link /track/[token] desde navegador/celular.", "Cliente ve estado, ETA, timeline y mapa sin entrar al panel.", "Aprobado"),
  @("TR-02", "Ubicacion manual", "Pulsar Enviar ubicacion una vez desde vista repartidor.", "Se inserta coordenada en courier_locations y el mapa refleja ultima posicion.", "Aprobado"),
  @("TR-03", "Tracking cada 5 segundos", "Cambiar pedido a En camino y dejar pantalla abierta.", "El sistema envia coordenadas automaticamente cada 5 segundos.", "Aprobado"),
  @("TR-04", "Prueba fuera de red local", "Abrir URL publica de Vercel desde celular usando datos moviles.", "El link funciona fuera de localhost/IP privada.", "Aprobado")
)

$securityTests = @(
  @("SE-01", "Panel protegido", "Intentar abrir /dashboard sin sesion.", "Redireccion a login.", "Aprobado"),
  @("SE-02", "Vista cliente aislada", "Abrir solo el link publico del pedido.", "El cliente no ve dashboard, pedidos internos ni repartidores.", "Aprobado"),
  @("SE-03", "Roles internos", "Entrar como owner, staff y driver.", "Cada rol accede al modulo correspondiente.", "Aprobado"),
  @("SE-04", "Driver filtrado", "Entrar como repartidor con ID asignado.", "El repartidor ve su panel y sus rutas, no el panel completo.", "En ajuste continuo")
)

$deploymentTests = @(
  @("DP-01", "Build local", "Ejecutar npm run build.", "Next compila y genera rutas dinamicas.", "Aprobado"),
  @("DP-02", "Variables Vercel", "Configurar Supabase, Twilio y URL publica.", "La app desplegada usa datos reales.", "Aprobado"),
  @("DP-03", "Zona horaria", "Comparar hora visible contra hora local Mexico.", "Eventos muestran hora correcta.", "Aprobado"),
  @("DP-04", "Compatibilidad movil", "Probar PWA en celular y navegador de escritorio.", "La experiencia funciona, con mejoras UX pendientes por iteracion.", "Aprobado")
)

$riskRows = @(
  @("Limite de Twilio Sandbox", "Alto", "No permite operacion real masiva.", "Se adopto flujo manual de WhatsApp y se deja Cloud API como opcion futura."),
  @("Permisos de geolocalizacion", "Medio", "El repartidor puede bloquear ubicacion.", "Boton manual de respaldo y mensajes claros de permiso."),
  @("Dependencia de pantalla activa", "Medio", "El tracking puede detenerse si el celular suspende la pagina.", "Mantener pantalla abierta; evaluar service workers/geolocation nativa en etapa futura."),
  @("Multiempresa incompleta", "Alto", "Cada negocio requiere espacio propio.", "Planificar modelo multi-tenant para la siguiente etapa.")
)

$content = New-Object System.Collections.Generic.List[string]
$content.Add((Para -Text "LocalTracker" -Style "Title" -Bold -Color "9F324D" -Size 56))
$content.Add((Para -Text "Metodologia Scrum aplicada a la segunda etapa del proyecto" -Style "Subtitle" -Color "4C3A42" -Size 28))
$content.Add((Spacer 120))
$content.Add((Callout -Title "Periodo documentado" -Body "Segunda etapa del desarrollo: del MVP operativo al sistema con tracking real, despliegue publico, seguridad por roles y experiencia visual mejorada. Proyecto iniciado el 18/04/2026 con entregas incrementales hasta el cierre parcial de la etapa."))
$content.Add((Spacer 200))
$content.Add((Para -Text "1. Objetivo de la segunda etapa" -Style "Heading1"))
$content.Add((Para -Text "La segunda etapa tuvo como objetivo transformar LocalTracker de un prototipo conectado a Supabase en una aplicacion web progresiva con flujo operativo real. El foco fue validar el ciclo completo: crear pedido, asignar repartidor, mover estados, compartir link al cliente, mostrar mapa en vivo y proteger las areas internas por rol."))
$content.Add((Para -Text "Tambien se busco reducir la friccion operativa: el cliente no debe entrar al sistema, el repartidor debe tener una vista propia y el negocio debe operar desde modulos separados."))
$content.Add((Para -Text "2. Metodologia aplicada" -Style "Heading1"))
$content.Add((Para -Text "Se utilizo Scrum como marco de trabajo agil. La etapa se dividio en sprints cortos, con entregables funcionales al cierre de cada ciclo. En lugar de esperar a tener el sistema completo, cada sprint dejo una pieza verificable del producto."))
$content.Add((Para -Text "La metodologia se aplico de forma practica: backlog priorizado, construccion incremental, revision constante con pruebas reales, ajustes por retroalimentacion y refinamiento continuo de interfaz."))
$content.Add((Para -Text "3. Roles Scrum adaptados al proyecto" -Style "Heading1"))
$content.Add((Table -Headers @("Rol", "Responsable en el proyecto", "Funcion aplicada") -Widths @(1700, 2800, 4860) -Rows @(
  @("Product Owner", "Usuario/dueno de la idea", "Define necesidad, valida pantallas, prioriza cambios y confirma si el flujo sirve para negocio real."),
  @("Scrum Master", "Asistente tecnico / facilitador", "Ordena sprints, elimina bloqueos, propone rutas de implementacion y mantiene el avance incremental."),
  @("Development Team", "Implementacion tecnica", "Construye Next.js, Supabase, mapas, autenticacion, despliegue, pruebas y documentacion.")
)))
$content.Add((Para -Text "4. Backlog de la segunda etapa" -Style "Heading1"))
$content.Add((Table -Headers @("Prioridad", "Historia de usuario", "Criterio de aceptacion") -Widths @(1200, 4300, 3860) -Rows @(
  @("Alta", "Como negocio quiero crear pedidos reales para operar entregas.", "El pedido se guarda en Supabase y aparece en dashboard."),
  @("Alta", "Como cliente quiero abrir un link y ver el avance de mi pedido.", "La URL publica muestra estado, ETA, mapa y timeline."),
  @("Alta", "Como repartidor quiero enviar mi ubicacion desde el celular.", "La ubicacion se registra y actualiza el mapa del cliente."),
  @("Alta", "Como administrador quiero proteger el panel interno.", "Solo usuarios autenticados con rol valido acceden."),
  @("Media", "Como negocio quiero separar pedidos, repartidores e historial.", "Cada modulo tiene pantalla propia y reduce ruido visual."),
  @("Media", "Como equipo quiero desplegar la app publicamente.", "La app funciona en Vercel fuera de la red local.")
)))
$content.Add((Para -Text "5. Planeacion y ejecucion por sprints" -Style "Heading1"))
$content.Add((Table -Headers @("Sprint", "Nombre", "Objetivo", "Entregables", "Evidencia de cierre") -Widths @(1050, 1600, 2600, 2500, 1610) -Rows $sprintRows))
$content.Add((Para -Text "6. Pruebas funcionales" -Style "Heading1"))
$content.Add((Table -Headers @("ID", "Prueba", "Procedimiento", "Resultado esperado", "Estado") -Widths @(900, 1900, 3200, 2600, 760) -Rows $functionalTests))
$content.Add((Para -Text "7. Pruebas de tracking y tiempo real" -Style "Heading1"))
$content.Add((Table -Headers @("ID", "Prueba", "Procedimiento", "Resultado esperado", "Estado") -Widths @(900, 1900, 3200, 2600, 760) -Rows $trackingTests))
$content.Add((Para -Text "8. Pruebas de seguridad y roles" -Style "Heading1"))
$content.Add((Table -Headers @("ID", "Prueba", "Procedimiento", "Resultado esperado", "Estado") -Widths @(900, 1900, 3200, 2600, 760) -Rows $securityTests))
$content.Add((Para -Text "9. Pruebas de despliegue y operacion" -Style "Heading1"))
$content.Add((Table -Headers @("ID", "Prueba", "Procedimiento", "Resultado esperado", "Estado") -Widths @(900, 1900, 3200, 2600, 760) -Rows $deploymentTests))
$content.Add((Para -Text "10. Definicion de terminado" -Style "Heading1"))
$content.Add((Para -Text "Un incremento se considero terminado cuando cumplia con estos criterios: lectura/escritura en Supabase, interfaz accesible desde la ruta correspondiente, validacion manual del flujo, ausencia de errores criticos de compilacion, y coherencia con el objetivo operativo del sprint."))
$content.Add((Table -Headers @("Criterio", "Aplicacion en la etapa") -Widths @(2500, 6860) -Rows @(
  @("Funcional", "La caracteristica se puede usar desde la interfaz sin editar datos manualmente."),
  @("Integrado", "La informacion se guarda o consulta desde Supabase."),
  @("Verificable", "Existe una prueba manual clara para confirmar el comportamiento."),
  @("Desplegable", "El cambio puede subirse a GitHub y Vercel sin romper el build."),
  @("Usable", "La pantalla reduce friccion para negocio, repartidor o cliente.")
)))
$content.Add((Para -Text "11. Riesgos detectados y mitigacion" -Style "Heading1"))
$content.Add((Table -Headers @("Riesgo", "Impacto", "Problema", "Mitigacion aplicada") -Widths @(2100, 1100, 2700, 3460) -Rows $riskRows))
$content.Add((Para -Text "12. Retrospectiva de la etapa" -Style "Heading1"))
$content.Add((Para -Text "Lo que funciono bien: el uso de entregas cortas permitio validar ideas rapidamente. El tracking real, el despliegue en Vercel y la separacion de vistas elevaron el proyecto de prototipo a producto operable."))
$content.Add((Para -Text "Lo que se ajusto durante el camino: el envio automatico por WhatsApp con Twilio Sandbox resulto limitado para uso real. Por ello se cambio temporalmente a un flujo manual de link compartible, manteniendo abierta la posibilidad de integrar WhatsApp Cloud API en una etapa posterior."))
$content.Add((Para -Text "Lo que queda para una siguiente etapa: robustecer multiempresa, crear cuentas independientes por negocio, mejorar la gestion de repartidores por ID, endurecer politicas RLS y preparar mensajeria empresarial real."))
$content.Add((Para -Text "13. Conclusion" -Style "Heading1"))
$content.Add((Para -Text "La segunda etapa aplico Scrum de manera incremental y orientada a pruebas reales. Cada sprint agrego valor visible: primero datos reales, luego tracking, despues despliegue, seguridad, roles y refinamiento visual. El resultado es una base funcional que ya permite operar pedidos, mostrar seguimiento en vivo y separar responsabilidades entre negocio, repartidor y cliente."))

$documentXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    $($content -join "`n")
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="900" w:right="900" w:bottom="900" w:left="900" w:header="450" w:footer="450" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>
"@

$stylesXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:pPr><w:spacing w:after="150" w:line="300" w:lineRule="auto"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos"/><w:sz w:val="22"/><w:color w:val="2B1D24"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Title">
    <w:name w:val="Title"/>
    <w:pPr><w:spacing w:after="120"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Aptos Display" w:hAnsi="Aptos Display"/><w:b/><w:sz w:val="56"/><w:color w:val="9F324D"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Subtitle">
    <w:name w:val="Subtitle"/>
    <w:pPr><w:spacing w:after="280"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos"/><w:sz w:val="28"/><w:color w:val="4C3A42"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:keepNext/><w:spacing w:before="320" w:after="160"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Aptos Display" w:hAnsi="Aptos Display"/><w:b/><w:sz w:val="30"/><w:color w:val="9F324D"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="CalloutTitle">
    <w:name w:val="Callout Title"/>
    <w:rPr><w:b/><w:sz w:val="22"/><w:color w:val="9F324D"/></w:rPr>
  </w:style>
</w:styles>
"@

$contentTypes = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>
"@

$rels = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>
"@

$documentRels = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>
"@

$created = (Get-Date).ToUniversalTime().ToString("s") + "Z"
$core = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>LocalTracker - Metodologia Scrum Etapa 2</dc:title>
  <dc:creator>LocalTracker</dc:creator>
  <cp:lastModifiedBy>Codex</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">$created</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">$created</dcterms:modified>
</cp:coreProperties>
"@

$app = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>LocalTracker Documentation Builder</Application>
</Properties>
"@

Set-Content -LiteralPath (Join-Path $buildDir "[Content_Types].xml") -Value $contentTypes -Encoding UTF8
Set-Content -LiteralPath (Join-Path $buildDir "_rels\.rels") -Value $rels -Encoding UTF8
Set-Content -LiteralPath (Join-Path $buildDir "word\document.xml") -Value $documentXml -Encoding UTF8
Set-Content -LiteralPath (Join-Path $buildDir "word\styles.xml") -Value $stylesXml -Encoding UTF8
Set-Content -LiteralPath (Join-Path $buildDir "word\_rels\document.xml.rels") -Value $documentRels -Encoding UTF8
Set-Content -LiteralPath (Join-Path $buildDir "docProps\core.xml") -Value $core -Encoding UTF8
Set-Content -LiteralPath (Join-Path $buildDir "docProps\app.xml") -Value $app -Encoding UTF8

if (Test-Path $outFile) {
  Remove-Item -LiteralPath $outFile -Force
}

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$zip = [System.IO.Compression.ZipFile]::Open($outFile, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  function Add-DocxPart {
    param(
      [string]$Source,
      [string]$EntryName
    )

    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
      $zip,
      $Source,
      $EntryName,
      [System.IO.Compression.CompressionLevel]::Optimal
    ) | Out-Null
  }

  Add-DocxPart -Source (Join-Path $buildDir "[Content_Types].xml") -EntryName "[Content_Types].xml"
  Add-DocxPart -Source (Join-Path $buildDir "_rels\.rels") -EntryName "_rels/.rels"
  Add-DocxPart -Source (Join-Path $buildDir "docProps\app.xml") -EntryName "docProps/app.xml"
  Add-DocxPart -Source (Join-Path $buildDir "docProps\core.xml") -EntryName "docProps/core.xml"
  Add-DocxPart -Source (Join-Path $buildDir "word\document.xml") -EntryName "word/document.xml"
  Add-DocxPart -Source (Join-Path $buildDir "word\styles.xml") -EntryName "word/styles.xml"
  Add-DocxPart -Source (Join-Path $buildDir "word\_rels\document.xml.rels") -EntryName "word/_rels/document.xml.rels"
}
finally {
  $zip.Dispose()
}

Remove-Item -LiteralPath $buildDir -Recurse -Force

Write-Output $outFile
