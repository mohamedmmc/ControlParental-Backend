import Artist from "../models/Artist.js";
import sendEmail from "../middlewares/sendEmail.js";
import generateOTP from "../middlewares/otpGenerator.js";
import sendMailOTP from "../middlewares/OTPmail.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cloudinary from "../middlewares/cloudinary.js";
dotenv.config();

//get all artists
export function getAllArtists(req, res) {
  Artist.find({})
    .then((artists) => {
      res.status(200).json(artists);
    })
    .catch((err) => {
      res.status(500).json({ error: err });
    });
}

//add one artist

export async function AddArtist(req, res) {
  try {
    let newArtist = await Artist.create({
      idArtist: req.body.idArtist,
      email: req.body.email,
      mdp: req.body.mdp,
      confirmMdp: req.body.confirmMdp,
      FullName: req.body.FullName,
    });
    if (req.file) {
      const photoCloudinary = await cloudinary.uploader.upload(req.file.path);
      newArtist.ProfilePic = photoCloudinary.url;
    } else {
      newArtist.ProfilePic = "no image";
    }
    newArtist.save();
    res.status(200).json(newArtist);
  } catch (error) {
    return res.status(500).json({ error: err });
  }
}

//Add many artists

//get one
export function getOneArtist(req, res) {
  const id = req.params.id;
  Artist.findById(id, "username PhoneNumber Gender BirthDate Description")
    .then((doc) => {
      res.status(200).json(doc);
    })
    .catch((err) => {
      res.status(500).json({ error: err });
    });
}

//Delete one artist

export function deleteOneArtist(req, res) {
  Artist.findOneAndRemove({ email: req.params.email })
    .then((doc) => {
      res.status(200).json(doc);
      console.log("User deleted with success");
    })
    .catch((err) => {
      res.status(500).json({ error: err });
    });
}

//Update artist by id

export async function UpdateArtistById(req, res) {
  const id = req.params.id;

  try {
    const foundArtist = await Artist.findById(id);
    if (foundArtist) {
      if (req.body.username != null) {
        foundArtist.username = req.body.username;
      }
      if (req.body.PhoneNumber != null) {
        foundArtist.PhoneNumber = req.body.PhoneNumber;
      }
      if (req.body.Gender != null) {
        foundArtist.Gender = req.body.Gender;
      }
      if (req.body.Description != null) {
        foundArtist.Description = req.body.Description;
      }
      if (req.body.BirthDate != null) {
        foundArtist.BirthDate = req.body.BirthDate;
      }
      if (req.file) {
        const photoCloudinary = await cloudinary.uploader.upload(req.file.path);
        foundArtist.ProfilePic = photoCloudinary.url;
      }
      const updatedUser = await foundArtist.save();
      return res.status(200).json(updatedUser);
    } else {
      return res.status(404).json({ reponse: "Utilisateur non trouve" });
    }
  } catch (error) {
    return res.status(500).json(error);
  }
}

//register

export async function registerArtist(req, res) {
  try {
    // Get Artist input
    const {
      email,
      mdp,
      FullName,
      confirmMdp,
      verified,
      otp,
      PhoneNumber,
      Gender,
      BirthDate,
      Description,
    } = req.body;

    // Validate Artist input
    if (!email) {
      res.status(400).send("All input is required");
    }

    // check if Artist already exist
    // Validate if Artist exist in our database
    const oldArtist = await Artist.findOne({ email });

    if (oldArtist) {
      return res.status(409).send("Artist Already Exist. Please Login");
    }

    //Encrypt password
    const encryptedmdp = await bcrypt.hash(mdp, 10);

    //generate otp
    const otpGenerated = generateOTP();

    // Create Artist in our database
    const NewArtist = new Artist({
      email: email.toLowerCase(),
      mdp: encryptedmdp,
      FullName,
      verified: false,
      otp: otpGenerated,
      PhoneNumber,
      Gender,
      BirthDate,
      Description,
      posts: [],
    });

    const token = jwt.sign(
      { user_id: Artist._id, email },
      process.env.TOKEN_KEY,
      {
        expiresIn: "2h",
      }
    );

    // save user token
    NewArtist.token = token;
    Artist.create(NewArtist).then((docs) => {
      res.status(200).json(NewArtist);
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error });
  }

  // return new user
}

export async function verifyEmail(req, res) {
  const { email, otp } = req.body;
  const user = await Artist.findOne({
    email,
  });
  if (!user) {
    return res.status(400).json("User not found");
  }
  if (user && user.otp !== otp) {
    return res.status(400).json("User not found");
  }

  const updatedUser = await Artist.findByIdAndUpdate(user._id, {
    verified: true,
  });
  return res.status(200).json(user);
}

//Login artist

export async function login(req, res) {
  try {
    const { email, mdp } = req.body;

    if (!(email && mdp)) {
      res.status(400).send("All input is required");
    }

    const artist = await Artist.findOne({ email });

    if (artist && (await bcrypt.compare(mdp, artist.mdp))) {
      // Create token
      const token = jwt.sign(
        { user_id: Artist._id, email },
        process.env.TOKEN_KEY,
        {
          expiresIn: "2h",
        }
      );

      // save user token
      artist.token = token;

      req.session.token = token;
      // artist
      res.status(200).json(artist);
    } else {
      res.status(400).send("invalid Information");
    }
  } catch (err) {
    console.log(err);
  }
}

//login with google

export async function loginGoogle(req, res) {
  try {
    const { email } = req.body;

    const artist = await Artist.findOne({ email });

    if (artist) {
      // Create token
      const token = jwt.sign(
        { user_id: Artist._id, email },
        process.env.TOKEN_KEY,
        {
          expiresIn: "2h",
        }
      );

      // save user token
      artist.token = token;

      req.session.token = token;
      // artist
      res.status(200).json(artist);
    } else {
      res.status(400).send("invalid Information");
    }
  } catch (err) {
    console.log(err);
  }
}

//sign out

export async function signOut(req, res, next) {
  try {
    req.session = null;
    return res.status(200).send({ message: "You've been signed out!" });
  } catch (err) {
    this.next(err);
  }
}

// //forgot password
// export async function forgotPassword(req,res,next){
//     const { email } = req.body;

//     const user=Artist.findOne({email});

//     if(!user){
//         return next (new ErrorResponse('There is no user with that email',404))
//     }

//     const resetToken= crypto.randomBytes(20).toString('hex');

//     Artist.resetPasswordToken = crypto
//         .createHash('sha256')
//         .update(resetToken)
//         .digest('hex');

//     Artist.resetPasswordExpire=Date.now() + 10 *60 *1000;

//     const resetUrl = `${req.protocol}://${process.env.BASE_URL}/resetPassword/${resetToken}`;

//     await sendEmail(email, "Password reset token", resetUrl);

//     res.status(200).json(resetUrl);

// }

// //Reset passowrd

// export async function resetPassword(req,res,next){

//     const resetPasswordToken = crypto.createHash('sha256').update(req.params.resetToken).digest('hex');

//     const user=Artist.findOne({
//         resetPasswordToken,
//         resetPasswordExpire:{$gt: Date.now()}
//     })

//     if(!user){
//         return next(new ErrorResponse('Invalid Token ',400));
//     }

//     user.mdp=req.body.mdp;
//     user.confirmMdp = req.body.confirmMdp;
//     user.resetPasswordToken=undefined;
//     user.resetPasswordExpire=undefined;
//     user.save();

//     res.send("password reset sucessfully.");
// }

// //Send reset password link

export async function resetOTP(req, res) {
  const user = Artist.findOne({ email: req.body.email });

  if (!user) throw new Error("User does not exist");

  //generate otp
  const otpGenerated = generateOTP();

  //update database
  user.resetOTP = otpGenerated;
  Artist.findOneAndUpdate(
    { email: req.body.email },
    {
      otpReset: otpGenerated,
    }
  )
    .then((docs) => {
      // send mail
      sendEmail(user.email, "Password Reset", otpGenerated);
      user.resetOTP = otpGenerated;
      res.status(200).json(user);
    })
    .catch((err) => {
      res.status(500).json({ error: err });
    });
}

// export async function  resetPassword(req, res)
// {
//     const user = await Artist.findOne({ email: req.body.email });

//     if (user.otpReset !== req.body.otpReset) {
//       throw new Error("Invalid or expired password reset OTP");
//     }

//     else{
//     const password=req.body.mdp
//     const encryptedmdp = await bcrypt.hash(password, 10);
//     await Artist.updateOne(user.email ,{ $set: { mdp: encryptedmdp } } );
//     sendEmail(user.email, "Password Reset","Password reset Successfull");
//     res.send("Password reset successfull ");

//     }

//   };

export async function sendpasswordEmail(req, res) {
  let user = await Artist.findOne({ email: req.body.email });
  if (user) {
    const OTP = Math.floor(1000 + Math.random() * 9000).toString();
    Artist.findOneAndUpdate(
      { _id: user._id },
      {
        otpReset: OTP,
      }
    )
      .then(async (docs) => {
        sendEmail(user.email, "Password Reset", OTP);
        user.otpReset = OTP;
        res.status(200).json(user);
      })
      .catch((err) => {
        res.status(500).json({ error: err });
      });
  } else {
    return res.status(404);
  }
}

export async function resendOTP(req, res) {
  try {
    const user = await Artist.findById(req.body.id);
    if (user) {
      sendMailOTP(user.email, user.otp);
      return res.status(200).json(user);
    } else {
      return res.status(404).json("user not found");
    }
  } catch (error) {
    return res.status(500).json(error);
  }
}

export async function resetPassword(req, res) {
  try {
    const user = await Artist.findOne({ email: req.body.email });

    if (user) {
      if (req.body.otpReset === user.otpReset) {
        const EncryptedPassword = await bcrypt.hash(req.body.mdp, 10);
        await Artist.findOneAndUpdate(
          { _id: user._id },
          {
            mdp: EncryptedPassword,
          }
        )
          .then((docs) => {
            res.status(200).json(docs);
          })
          .catch((err) => {
            res.status(500).json("Cant reset password");
          });
      } else {
        return res.status(404).json("wrong otp");
      }
    } else {
      return res.status(404).json("user not found");
    }
  } catch (error) {
    return res.status(500).json(error);
  }

  // }
}

//follow user
export async function followArtist(req, res) {
  if (req.body.userId !== req.params.id) {
    try {
      const user = await Artist.findById(req.params.id);
      const currentUser = await Artist.findById(req.body.userId);
      if (!user.followers.includes(req.body.userId)) {
        await user.updateOne({ $push: { followers: req.body.userId } });
        await currentUser.updateOne({ $push: { followings: req.params.id } });
        res.status(200).json("user has been followed");
      } else {
        res.status(403).json("you allready follow this user");
      }
    } catch (err) {
      res.status(500).json(err);
    }
  } else {
    res.status(403).json("you cant follow yourself");
  }
}

//unfollow a user

export async function unfollowArtist(req, res) {
  if (req.body.userId !== req.params.id) {
    try {
      const user = await Artist.findById(req.params.id);
      const currentUser = await Artist.findById(req.body.userId);
      if (user.followers.includes(req.body.userId)) {
        await user.updateOne({ $pull: { followers: req.body.userId } });
        await currentUser.updateOne({ $pull: { followings: req.params.id } });
        res.status(200).json("user has been unfollowed");
      } else {
        res.status(403).json("you dont follow this user");
      }
    } catch (err) {
      res.status(500).json(err);
    }
  } else {
    res.status(403).json("you cant unfollow yourself");
  }
}

//get all user posts

export async function getAllPosts(req, res) {
  try {
    const userId = req.params.id;
    const result = await Artist.findById(userId).populate("posts");
    res.send(result.posts);
  } catch (err) {
    console.log(err);
    res.status(500).send("Something went wrong, check logs");
  }
}
