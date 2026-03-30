export let userProfile = {
  name: "",
  mileage: "",
  goalEvent: "",
  pr5k: "",
};

export function setUserProfile(data: any) {
  userProfile = data;
}