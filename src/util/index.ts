const delay = async (ns: number) => {
  return new Promise(res => {
    setTimeout(() => {
      res();
    }, ns * 1000);
  })
}

const noImpl = ()=>{
  throw "no implement"
}


export {
  delay,
  noImpl
}
