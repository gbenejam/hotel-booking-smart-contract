import Web3 from "web3";
import hotelBookingArtifact from "../../build/contracts/HotelBooking.json";
import { create } from 'ipfs-http-client';
import bs58 from 'bs58';
import { Buffer } from 'buffer';


const App = {
  web3: null,
  hotelBooking: null,
  account: null,
  ipfs: null,

  start: async function () {
    const { web3 } = this;

    try {
      // Get contract instance
      const networkId = await web3.eth.net.getId();
      this.hotelBooking = new web3.eth.Contract(
        hotelBookingArtifact.abi,
        hotelBookingArtifact.networks[networkId].address
      );

      // Get accounts
      const accounts = await web3.eth.getAccounts();
      this.account = accounts[0];

      const balance = await web3.eth.getBalance(this.account);

      // Account info
      document.getElementById("accountAddress").innerText = this.account;
      document.getElementById("accountBalance").innerText = balance + ' Wei';

      // Get IPFS instance
      this.ipfs = create({ host: 'localhost', port: '5001', protocol: 'http' });

    } catch (error) {
      console.error("Could not connect to contract or chain");
    }
  },

  updateAccountInfo: async function () {
    const { web3 } = this;
    const balance = await web3.eth.getBalance(this.account);
    document.getElementById("accountBalance").innerText = balance + ' Wei';
  },

  // JS function example
  getOwner: async function () {
    const { owner } = this.hotelBooking.methods;
    const ownerElement = document.getElementsByClassName("owner")[0];
    ownerElement.innerHTML = await owner().call();
  },

  registerHotel: async function () {
    const web3 = window.App.web3;
    const { registerHotel } = this.hotelBooking.methods;
    const hotelName = document.getElementById("hotelNameRegister").value;
    const hotelPrice = document.getElementById("hotelPriceRegister").value;

    //Check if name value is not empty
    if (!hotelName.trim()) {
      alert("Please enter a hotel name.");
      return null;
    }

    //Checking if price value is valid
    const hotelPriceNum = parseFloat(hotelPrice);
    if (isNaN(hotelPriceNum) || hotelPriceNum <= 0) {
        alert("Please enter a valid base price for the hotel.");
        return null;
    }

    try {
      console.log("Registering hotel: ", hotelName, hotelPrice);
      const response = await registerHotel(hotelName, hotelPrice).send({ from: this.account });

      const transactionHash = response.transactionHash;
      const receipt = await web3.eth.getTransactionReceipt(transactionHash);

      const transactionInfoElement = document.getElementById("transactionInfo");
      transactionInfoElement.innerHTML = `
        <p style="font-weight: bold;">Transaction hash: ${transactionHash}</p>
        <p style="font-weight: bold;">Transaction status: ${receipt.status}</p>
      `;

      console.log(receipt);

    } catch (error) {
        console.error("Error registering hotel: ", error);
    }
  },

  bookHotel: async function () {
    const web3 = window.App.web3;
    const { bookHotel } = this.hotelBooking.methods;
    const name = document.getElementById("hotelNameBook").value;
    const roomType = document.getElementById("roomType").value;
    const bookingDays = document.getElementById("bookingDays").value;

    //Checking if hotelName value is not empty
    if (!name.trim()) {
      alert("Please enter a hotel name.");
      return null;
    }

    //Checking if booking days value is valid
    const bookingDaysValue = parseInt(bookingDays);
    if (isNaN(bookingDaysValue) || bookingDaysValue <= 0) {
        alert("Please enter a valid number of booking days.");
        return null;
    }

    //Checking if room type value is valid
    const roomTypeNum = parseInt(roomType);
    console.log(roomTypeNum);
    if(isNaN(roomTypeNum)){
      alert("Please enter a valid room type.");
      return null;
    }

    try {
      console.log("Booking hotel: ", name, roomType, bookingDays);
      const estimatedPrice = await this.hotelBooking.methods.estimateBookingPrice(name, roomTypeNum, bookingDays).call();
      const amountToSend = estimatedPrice.toString();
      const estimatedGas = await bookHotel(name, roomTypeNum, bookingDays).estimateGas({ from: this.account, value: amountToSend });

      const gasLimit = estimatedGas + BigInt(100000);

      console.log("Estimated gas: ", estimatedGas);
      console.log("Gas limit: ", gasLimit);

      const response = await bookHotel(name, roomTypeNum, bookingDays).send({ from: this.account, value: amountToSend, gas: gasLimit });

      const transactionHash = response.transactionHash;
      const receipt = await web3.eth.getTransactionReceipt(transactionHash);

      const transactionInfoElement = document.getElementById("bookedHotel");
      transactionInfoElement.innerHTML = `
        <p style="font-weight: bold;">Transaction hash: ${transactionHash}</p>
        <p style="font-weight: bold;">Transaction status: ${receipt.status}</p>
      `;
      console.log(receipt);

      this.updateAccountInfo();
    } catch (error) {
        console.error("Error booking hotel: ", error);
    }
  },

  getEstimatedBookingPrice: async function () {
    const { estimateBookingPrice } = this.hotelBooking.methods;
    const name = document.getElementById("hotelNameEstimate").value;
    const roomType = document.getElementById("roomTypeEstimate").value;
    const bookingDays = document.getElementById("bookingDaysEstimate").value;
    const estimatedPriceElement = document.getElementById("estimatedPrice");

    //Checking if hotelName value is not empty
    if (!name.trim()) {
      alert("Please enter a hotel name.");
      return null;
    }

    //Checking if booking days value is valid
    const bookingDaysValue = parseInt(bookingDays);
    if (isNaN(bookingDaysValue) || bookingDaysValue <= 0) {
        alert("Please enter a valid number of booking days.");
        return null;
    }

    //Checking if room type value is valid
    const roomTypeNum = parseInt(roomType);
    console.log(roomTypeNum);
    if(isNaN(roomTypeNum)){
      alert("Please enter a valid room type.");
      return null;
    }

    try {
      console.log("Getting estimated booking price: ", name, roomType, bookingDays);
      const estimatedPrice = await estimateBookingPrice(name, roomTypeNum, bookingDays).call();
      estimatedPriceElement.innerHTML = `Estimated price: ${estimatedPrice.toString()} Wei`;
    } catch (error) {
      console.error("Error getting estimated booking price: ", error);
    }
  },

  getHotelBookings: async function () {
    const { getHotelBookings } = this.hotelBooking.methods;
    const name = document.getElementById("getBookings").value;
    const hotelBookingsElement = document.getElementById("bookingsResult");
    hotelBookingsElement.innerHTML = "";

    //Checking if hotelName value is not empty
    if (!name.trim()) {
      alert("Please enter a hotel name.");
      return null;
    }

    try {
      const bookings = await getHotelBookings(name).call();
      console.log("Bookings: ", bookings);
      const bookingsList = bookings.map((booking) => {
        return `<li>Customer: ${booking.customer} - Room type: ${booking.roomType} - Booking days: ${booking.bookingDays}</li>`;
      });
      hotelBookingsElement.innerHTML = `<ul>${bookingsList.join("")}</ul>`;
    } catch (error) {
      console.error("Error getting hotel bookings: ", error);
    }
  },

  uploadFileToIPFS: async function () {
    try{
      const input = document.getElementById('fileInput');
      const file = input.files[0];
      if (file) {
        console.log(file);
        const newFile = await this.ipfs.add(file);
        console.log("Adding new file: ", newFile.path);
        return newFile.path;
      }
    } catch (error) {
      console.error("Could not upload file to IPFS");
    }
  },

  uploadFileAndSetHash: async function () {
    const { setIPFSHash } = this.hotelBooking.methods;
    const name = document.getElementById('hotelNameUpload').value;
    try {
      const hash = await this.uploadFileToIPFS();
      if(!hash){
        console.error("Could not upload file to IPFS");
        return null;
      }

      const hexHash = this.convertIPFSHashToHex_param(hash);

      console.log(hexHash);

      const hashFunction = hexHash.substring(0,4);
      const hashSize = '0x' + hexHash.substring(4,6);
      const digest = '0x' + hexHash.substring(6);

      console.log("Hash function: ", hashFunction, " - Hash size: ", hashSize, " - Digest: ", digest);

      const result = await setIPFSHash(name, hashFunction, hashSize, digest).send({ from: this.account });

      if(result) {
        console.log("Hash set successfully in contract with IPFS hash: ", hash);
        const uploadInfoElement = document.getElementById("uploadedFileHash");
        uploadInfoElement.innerHTML = `
        <p style="font-weight: bold;">IPFS Hash: ${hash}</p>
        <p style="font-weight: bold;">IPFS Hexadecimal: ${hexHash}</p>
        <p style="font-weight: bold;">Hash function: ${hashFunction}</p>
        <p style="font-weight: bold;">Hash size: ${hashSize}</p>
        <p style="font-weight: bold;">Digest: ${digest}</p>`
      }

    } catch (error) {
      console.error("Error setting IPFS hash", error);
    }
  },

  downloadIPFSFile: async function () {
      const hash = document.getElementById('fileDownload').value;
      if(hash){
        const fileChunks = [];
        for await (const chunk of this.ipfs.cat(hash)) {
          fileChunks.push(chunk);
        }
        
        const fileBlob = new Blob(fileChunks, { type: "application/octet-stream" });
        const fileURL = URL.createObjectURL(fileBlob);
        const downloadLink = document.createElement('a');


        downloadLink.href = fileURL;
        downloadLink.download = hash;
        document.body.appendChild(downloadLink);
        downloadLink.click(); 
      }
  },

  getIPFSHash: async function () {
    const { getIPFShash } = this.hotelBooking.methods;
    const name = document.getElementById('hotelNameHash').value;
    try {
      const hash = await getIPFShash(name).call();
      if(hash){
        console.log("IPFS Hash: ", hash);
        const outputElement = document.getElementById("ipfsHashOutput");
        outputElement.innerHTML = `
        <p style="font-weight: bold;">IPFS Hash: ${hash}</p>`
      }
    } catch (error) {
      console.error("Error getting IPFS hash", error);
    }
  },

  convertIPFSHashToHex_param: function (hash) {
    const bytes = bs58.decode(hash);
    
    const hexString = bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '0x');

    return hexString;
  },

  convertIPFSHashToHex: function () {
    const hash = document.getElementById("hash_to_hex").value;

    const bytes = bs58.decode(hash);
    
    const hexString = bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '0x');

    console.log(hexString);

    const outputElement = document.getElementById("status_hash_to_hex");
    outputElement.innerHTML = `
    <p style="font-weight: bold;">IPFS Hexadecimal: ${hexString}</p>`
  },

  convertHexToIPFSHash: function () {
    const hex = document.getElementById("hex_to_hash").value;
    
    // IPFS Hashes start with 1220
    if(!hex.startsWith("1220")){
      console.error("Invalid hex string, it should start with 1220");
      return null;
    }

    const hexBuffer = Buffer.from(hex.slice(4), 'hex');
    const buffer = Buffer.concat([
      Buffer.from('1220', 'hex'),
      hexBuffer
    ]);

    const hash = bs58.encode(buffer);
    console.log(hash);
    const outputElement = document.getElementById("status_hex_to_hash");
    outputElement.innerHTML = `
    <p style="font-weight: bold;">IPFS Hash: ${hash}</p>`
  }
};



window.App = App;

window.addEventListener("load", function () {
  App.web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"));
  App.start();
});
