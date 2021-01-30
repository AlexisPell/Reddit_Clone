// if it is undefined- we are on the server,
// else it is accessable to be defined from browser and isServer is gonna be false
export const isServer = () => typeof window === 'undefined';
