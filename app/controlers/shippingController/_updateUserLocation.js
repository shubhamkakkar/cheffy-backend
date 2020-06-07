exports._updateUserLocation = async (req, lat, lon) => {
  return await req.user.update({ location_lat: lat, location_lon: lon });
};
