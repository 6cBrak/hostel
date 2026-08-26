export function mapEmbedSrc({ latitude, longitude, address, name }) {
  if (latitude != null && longitude != null) {
    return `https://www.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`
  }
  const query = address ? `${name}, ${address}` : `${name}, Ghana`
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`
}
