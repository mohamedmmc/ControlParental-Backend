import Post from "../models/Post.js";
import Artist from "../models/Artist.js";
import cloudinary from "../middlewares/cloudinary.js";
// create post
export async function addPost(req, res) {
  const { userId } = req.body;
  let existingUser;
  try {
    existingUser = await Artist.findById(userId);

    if (!existingUser) {
      return res.status(400).json({ message: "Unable to find the user" });
    }
    let newPost = await Post.create({
      title: req.body.title,
      description: req.body.description,
      userId: userId,
    });
    if (req.file) {
      const photoCloudinary = await cloudinary.uploader.upload(req.file.path);
      newPost.image = photoCloudinary.url;
    } else {
      newPost.image = "no image";
    }
    //existingUser.posts.push(newPost);
    newPost.save();
    res.status(200).json(newPost);
  } catch (err) {
    return res.status(500).json({ message: err });
  }
}

//update post
export async function UpdatePostById(req, res) {
  const id = req.params.id;

  Post.findByIdAndUpdate(id, {
    title: req.body.title,
    description: req.body.description,
  })
    .then((docs) => {
      res.status(200).json(docs);
    })
    .catch((err) => {
      res.status(500).json({ error: err });
    });
}

//get post by Id
export async function getPost(req, res) {
  const id = req.params.id;
  Post.find({ userId: id })
    .populate("userId")
    .then((doc) => {
      res.status(200).json(doc);
    })
    .catch((err) => {
      res.status(500).json({ error: err });
    });
}

//get all posts
export async function getAllPosts(req, res) {
  const id = req.params.id;
  Post.find()
    .populate("userId")
    .then((doc) => {
      res.status(200).json(doc);
    })
    .catch((err) => {
      res.status(500).json({ error: err });
    });
}

//delete post

export function deleteOnePost(req, res) {
  const id = req.params.id;
  Post.findByIdAndDelete(id)
    .then((doc) => {
      res.status(200).json(doc);
      console.log("Post deleted with success");
    })
    .catch((err) => {
      res.status(500).json({ error: err });
    });
}

//Like a post
export async function LikePost(req, res) {
  try {
    const post = await Post.findById(req.params.id);
    const userId = req.body.userId;

    !post.likes.includes(userId)
      ? await post.updateOne({ $push: { likes: userId } })
      : await post.updateOne({ $pull: { likes: userId } });

    const message = !post.likes.includes(userId)
      ? "The post has been liked"
      : "The post has been disliked";
    res.status(200).json({ message });
  } catch (err) {
    res.status(500).json(err);
  }
}
