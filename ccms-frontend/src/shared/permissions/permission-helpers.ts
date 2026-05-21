export function hasPermission(permissions: string[], required: string) {
  return permissions.includes(required)
}

export function hasAllPermissions(permissions: string[], required: string[]) {
  return required.every((permission) => permissions.includes(permission))
}

export function hasAnyPermission(permissions: string[], required: string[]) {
  return required.some((permission) => permissions.includes(permission))
}
