// Reglas de capas. Capas de la aplicación (propuesta en docs/plan.md):
//   src/dominio          lógica pura: planificador, criterio de dominio, fases, ayuda, calibración
//   src/aplicacion       casos de uso; orquesta el dominio a través de interfaces (puertos)
//   src/infraestructura  SQLite, ficheros, reloj… implementa los puertos
//   src/interfaz         interfaz web local
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'dominio-puro',
      comment:
        'src/dominio no importa otras capas, ni módulos de Node (fs, http, sqlite…), ni paquetes de npm. ' +
        'Pásale los datos como argumentos o define una interfaz en el dominio y impleméntala en infraestructura.',
      severity: 'error',
      from: { path: '^src/dominio/' },
      to: { pathNot: '^src/dominio/' },
    },
    {
      name: 'aplicacion-sin-infraestructura-ni-interfaz',
      comment:
        'src/aplicacion depende solo del dominio. Usa una interfaz (puerto) y que infraestructura la implemente.',
      severity: 'error',
      from: { path: '^src/aplicacion/' },
      to: { path: '^src/(infraestructura|interfaz)/' },
    },
    {
      name: 'infraestructura-sin-interfaz',
      comment: 'src/infraestructura no conoce la interfaz web.',
      severity: 'error',
      from: { path: '^src/infraestructura/' },
      to: { path: '^src/interfaz/' },
    },
    {
      name: 'aplicacion-sin-tests-ni-arnes',
      comment: 'El código de la aplicación no importa tests, scripts ni hooks.',
      severity: 'error',
      from: { path: '^src/' },
      to: { path: '^(tests|scripts|\\.claude)/' },
    },
    {
      name: 'aplicacion-sin-dependencias-de-desarrollo',
      comment: 'src/ no puede usar devDependencies: no estarían al ejecutar la aplicación.',
      severity: 'error',
      from: { path: '^src/' },
      to: { dependencyTypes: ['npm-dev'] },
    },
    {
      name: 'arnes-independiente-de-la-aplicacion',
      comment: 'El arnés (scripts, hooks y sus tests) no depende del código de la aplicación.',
      severity: 'error',
      from: { path: '^(scripts|\\.claude/hooks|tests/arnes)/' },
      to: { path: '^src/' },
    },
    {
      name: 'aceptacion-contra-la-capa-de-aplicacion',
      comment: 'Los steps de Cucumber hablan con src/aplicacion, no con el dominio, la infraestructura ni la interfaz.',
      severity: 'error',
      from: { path: '^tests/aceptacion/' },
      to: { path: '^src/(dominio|infraestructura|interfaz)/' },
    },
    {
      name: 'sin-ciclos',
      comment: 'Dependencia circular: extrae lo común a un módulo propio.',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'sin-imports-rotos',
      comment: 'Import que no se puede resolver.',
      severity: 'error',
      from: {},
      to: { couldNotResolve: true },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '^(node_modules|reports|\\.stryker-tmp|docs|features)/' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      extensions: ['.ts', '.js', '.json'],
    },
  },
};
