import User from "../model/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ------------------ REGISTER USER ------------------
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, role, bloodGroup, location } = req.body;

    // 1️⃣ Validate input
    if (!name || !email || !password || !phone || !location?.address || !location?.coordinates) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const [lng, lat] = location.coordinates; // Extract coordinates

    // 2️⃣ Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // 3️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4️⃣ Create user (GeoJSON format)
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role,
      bloodGroup,
      location: {
        address: location.address,
        coordinates: {
          type: "Point",
          coordinates: [lng, lat],
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        role: newUser.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ------------------ LOGIN USER ------------------
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user and include the role and location for the frontend
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role }, // Optional: Add role to JWT payload
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // --- KEY ADDITION: Return the user info ---
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role, // "donor" or "hospital"
        bloodGroup: user.bloodGroup,
        location: user.location, // Contains coordinates for nearby searches
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};