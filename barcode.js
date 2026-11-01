/* Basic zero-dependency EAN-13 scanner for camera frames.
   Browsers with BarcodeDetector use the native implementation first.
   This image decoder is a best-effort fallback: angled, blurred or glared
   barcodes may still need manual ISBN entry. */
(() => {
  'use strict';
  const L=['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011'];
  const G=['0100111','0110011','0011011','0100001','0011101','0111001','0000101','0010001','0001001','0010111'];
  const R=['1110010','1100110','1101100','1000010','1011100','1001110','1010000','1000100','1001000','1110100'];
  const parity=['LLLLLL','LLGLGG','LLGGLG','LLGGGL','LGLLGG','LGGLLG','LGGGLL','LGLGLG','LGLGGL','LGGLGL'];
  const digit=(seq,patterns)=>patterns.indexOf(seq);
  const checksum=code=>code.length===13&&[...code].reduce((sum,char,i)=>sum+Number(char)*(i%2?3:1),0)%10===0;
  function decode(bits){
    if(bits.length!==95||!bits.startsWith('101')||bits.slice(45,50)!=='01010'||!bits.endsWith('101'))return null;
    let left='',right='',pattern='';
    for(let i=0;i<6;i++){
      const seven=bits.slice(3+i*7,10+i*7);let d=digit(seven,L);if(d>=0){left+=d;pattern+='L';continue}
      d=digit(seven,G);if(d<0)return null;left+=d;pattern+='G';
    }
    for(let i=0;i<6;i++){const d=digit(bits.slice(50+i*7,57+i*7),R);if(d<0)return null;right+=d}
    const leading=parity.indexOf(pattern);if(leading<0)return null;
    const isbn=String(leading)+left+right;
    return /^97[89]/.test(isbn)&&checksum(isbn)?isbn:null;
  }
  function sample(data,y){
    const {width,height}=data,rgba=data.data,gray=new Float32Array(width);
    for(let x=0;x<width;x++){
      let g=0;
      for(let dy=-1;dy<=1;dy++){
        const yy=Math.max(0,Math.min(height-1,y+dy)),i=(yy*width+x)*4;
        g+=rgba[i]*.299+rgba[i+1]*.587+rgba[i+2]*.114;
      }
      gray[x]=g/3;
    }
    return gray;
  }
  function scanLine(line){
    const w=line.length,sorted=Array.from(line).sort((a,b)=>a-b);
    const low=sorted[Math.floor(w*.12)],high=sorted[Math.floor(w*.88)];
    if(high-low<42)return null;
    for(const threshold of [low+(high-low)*.4,low+(high-low)*.52,low+(high-low)*.63]){
      const runs=[];let prev=line[0]<threshold?1:0,start=0;
      for(let i=1;i<=w;i++){
        const curr=i<w?(line[i]<threshold?1:0):1-prev;
        if(curr!==prev){runs.push({value:prev,start,width:i-start});start=i;prev=curr}
      }
      for(let i=0;i<runs.length-3;i++){
        const a=runs[i],b=runs[i+1],c=runs[i+2];
        if(a.value!==1||b.value!==0||c.value!==1)continue;
        const widths=[a.width,b.width,c.width],m=widths.reduce((sum,v)=>sum+v,0)/3;
        if(m<1.1||m>11||Math.max(...widths)>m*1.65||Math.min(...widths)<m*.45)continue;
        if(a.start+95*m>w)continue;
        for(const adjust of [.97,1,1.03]){
          const moduleWidth=m*adjust;
          if(a.start+95*moduleWidth>=w)continue;
          let bits='';
          for(let j=0;j<95;j++){
            const x=Math.min(w-1,Math.max(0,Math.floor(a.start+(j+.5)*moduleWidth)));
            bits+=line[x]<threshold?'1':'0';
          }
          const decoded=decode(bits);if(decoded)return decoded;
        }
      }
    }
    return null;
  }
  function scan(imageData){
    if(!imageData?.data||imageData.width<120)return null;
    for(const position of [.48,.5,.52,.44,.56,.4,.6,.35,.65]){
      const result=scanLine(sample(imageData,Math.floor(imageData.height*position)));
      if(result)return result;
    }
    return null;
  }
  window.FolioBarcode={scan};
})();
