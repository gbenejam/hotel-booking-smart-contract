const HotelBooking = artifacts.require("HotelBooking");

module.exports = function (deployer) {
  deployer.deploy(HotelBooking);
};
