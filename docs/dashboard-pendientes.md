# Dashboard: indicadores y decisiones pendientes

Registro de lo que queda para revisar después del rediseño del dashboard (Novedades y KPIs).

## Indicadores para revisar más adelante
- **Audiencias con suspensión**: requiere un estado de audiencia (celebrada, suspendida, reprogramada). Hoy la tabla `eventos` no lo tiene.
- **Tasa de éxito por tipo de audiencia**: requiere un objetivo declarado por audiencia y su resultado. Hoy no existe.

## Módulos en gris (próxima versión)
- **Consultas recibidas, conversión de consultas y consultas sin respuesta +48 h**: dependen del módulo de captación, que todavía no existe.
- **Alcance "Equipo" y "Todas"**: dependen de equipos con roles. Hoy solo está disponible "Mis causas".

## Criterios adoptados (a confirmar)
- **Antigüedad de la deuda**: se mide desde la fecha del pacto de cada honorario.
- **Moneda**: cada indicador en dinero se muestra separado en $ y US$.
- **Vencimiento urgente / próximo**: urgente = dentro de 3 días; próximo = entre 4 y 7 días. La spec no define estos plazos.
- **Clientes sin contacto +60 días**: no hay fecha de último contacto en la base. Se quita hasta definirlo.
