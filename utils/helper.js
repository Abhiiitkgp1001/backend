export const generateTripName = () => {
    let date = new Date();
    date = "Trip-" + date.toISOString();
    return date;
}

export const generateCurTime = () => {
    let date = new Date();
    date = date.toISOString();
    return date;
}