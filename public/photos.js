// Resize uploads in the browser so local demo storage is not filled by camera originals.
export async function readPhoto(file){
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Elegí una foto JPG, PNG o WebP.');
  if(file.size>15*1024*1024)throw Error('La imagen debe pesar menos de 15 MB.');
  const image=await createImageBitmap(file);
  try{const scale=Math.min(1,1000/Math.max(image.width,image.height));const canvas=document.createElement('canvas');canvas.width=Math.round(image.width*scale);canvas.height=Math.round(image.height*scale);const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/jpeg',.78)}finally{image.close()}
}
