export function resolveFullImportPaths(code: string) {
  function resolver(pathname: string) {
    return pathname
      .replace(
        /from\s+["'](?!@|\w|[^"']+\.(?:ts|js))[^"'](.+)["']/g,
        'from ".$1.js"'
      )
      .replace(/from\s+["']([^"'].+)\.(?:ts|js)["']/g, 'from "$1.js"')
      .replace(
        /(from\s+["'][^"'].+\.(?:json)["']\swith\s{\stype: ["']json['"]\s};?)$/g,
        '$1'
      )
  }

  return code
    .split('\n')
    .map((item) => resolver(item))
    .join('\n')
}
