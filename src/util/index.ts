const delay = async (ns: number) => {
  return new Promise(res => {
    setTimeout(() => {
      res();
    }, ns * 1000);
  })
}

export {
  delay
}
