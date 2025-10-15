export function generateRandomColors() {
  // Generate a random background color
  const hue = Math.floor(Math.random() * 360);
  const saturation = 70 + Math.floor(Math.random() * 30);
  const lightness = 80 + Math.floor(Math.random() * 15);
  
  const backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  
  // Generate a contrasting text color (black or white) based on background brightness
  const textColor = lightness > 50 ? '#000000' : '#ffffff';
  
  return { backgroundColor, textColor };
}
