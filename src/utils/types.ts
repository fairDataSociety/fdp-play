type FlavoredType<Type, Name> = Type & {
  __tag__?: Name
}
type NumberString = FlavoredType<string, 'number'>

export function isNumberString(value: string): value is NumberString {
  return /^\d+(\.\d+)?$/.test(value)
}
