export default async function (length:number) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
  return alphabet.repeat(20).split("").sort(() => Math.random() - 0.5).join("").slice(0, length)
}