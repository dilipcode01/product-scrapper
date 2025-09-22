const { exec } = require("child_process")
const { promisify } = require("util")
const fs = require("fs").promises
const path = require("path")

const execAsync = promisify(exec)

class BlenderRenderer {
  constructor() {
    this.blenderPath = process.env.BLENDER_PATH || "blender"
    this.scriptsDir = path.join(__dirname, "../blender_scripts")
    this.ensureScriptsDirectory()
  }

  async ensureScriptsDirectory() {
    try {
      await fs.access(this.scriptsDir)
    } catch {
      await fs.mkdir(this.scriptsDir, { recursive: true })
      await this.createBlenderScripts()
    }
  }

  async createBlenderScripts() {
    // Create Python script for Blender automation
    const renderScript = `
import bpy
import bmesh
import sys
import json
import os
from mathutils import Vector

def clear_scene():
    """Clear default scene"""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)

def create_product_mesh(dimensions, category):
    """Create a basic mesh based on product dimensions and category"""
    width, height, depth = dimensions['width'] / 100, dimensions['height'] / 100, dimensions['depth'] / 100
    
    if category in ['furniture', 'storage']:
        # Create a box-like structure
        bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0, height/2))
        obj = bpy.context.active_object
        obj.scale = (width/2, depth/2, height/2)
    elif category in ['electronics']:
        # Create a sleeker rectangular shape
        bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0, height/2))
        obj = bpy.context.active_object
        obj.scale = (width/2, depth/2, height/2)
        # Add some beveling for electronics look
        bpy.ops.object.modifier_add(type='BEVEL')
        bpy.context.object.modifiers["Bevel"].width = 0.01
    elif category in ['books']:
        # Create a thin rectangular shape
        bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0, height/2))
        obj = bpy.context.active_object
        obj.scale = (width/2, depth/2, height/2)
    else:
        # Default shape
        bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0, height/2))
        obj = bpy.context.active_object
        obj.scale = (width/2, depth/2, height/2)
    
    return obj

def setup_materials(obj, category, materials):
    """Setup materials based on category and materials list"""
    mat = bpy.data.materials.new(name=f"{category}_material")
    mat.use_nodes = True
    
    # Get the principled BSDF node
    principled = mat.node_tree.nodes.get('Principled BSDF')
    
    # Set material properties based on category
    if 'wood' in materials:
        principled.inputs['Base Color'].default_value = (0.6, 0.4, 0.2, 1.0)
        principled.inputs['Roughness'].default_value = 0.8
    elif 'metal' in materials:
        principled.inputs['Base Color'].default_value = (0.7, 0.7, 0.7, 1.0)
        principled.inputs['Metallic'].default_value = 1.0
        principled.inputs['Roughness'].default_value = 0.2
    elif 'plastic' in materials:
        principled.inputs['Base Color'].default_value = (0.8, 0.8, 0.8, 1.0)
        principled.inputs['Roughness'].default_value = 0.3
    else:
        principled.inputs['Base Color'].default_value = (0.5, 0.5, 0.5, 1.0)
    
    obj.data.materials.append(mat)

def setup_lighting():
    """Setup proper lighting for rendering"""
    # Add key light
    bpy.ops.object.light_add(type='SUN', location=(5, 5, 10))
    key_light = bpy.context.active_object
    key_light.data.energy = 3
    
    # Add fill light
    bpy.ops.object.light_add(type='AREA', location=(-3, 2, 5))
    fill_light = bpy.context.active_object
    fill_light.data.energy = 1
    fill_light.data.size = 5

def setup_camera(view_type, dimensions):
    """Setup camera for different views"""
    bpy.ops.object.camera_add()
    camera = bpy.context.active_object
    
    max_dim = max(dimensions['width'], dimensions['height'], dimensions['depth']) / 100
    distance = max_dim * 3
    
    if view_type == 'front':
        camera.location = (0, -distance, dimensions['height'] / 200)
        camera.rotation_euler = (1.1, 0, 0)
    elif view_type == 'side':
        camera.location = (distance, 0, dimensions['height'] / 200)
        camera.rotation_euler = (1.1, 0, 1.57)
    elif view_type == 'top':
        camera.location = (0, 0, distance)
        camera.rotation_euler = (0, 0, 0)
    
    bpy.context.scene.camera = camera

def render_view(output_path, view_type, product_data):
    """Render a specific view of the product"""
    clear_scene()
    
    # Create product mesh
    obj = create_product_mesh(product_data['dimensions'], product_data['category'])
    
    # Setup materials
    setup_materials(obj, product_data['category'], product_data['annotations']['materials'])
    
    # Setup lighting
    setup_lighting()
    
    # Setup camera
    setup_camera(view_type, product_data['dimensions'])
    
    # Render settings
    bpy.context.scene.render.engine = 'CYCLES'
    bpy.context.scene.render.filepath = output_path
    bpy.context.scene.render.image_settings.file_format = 'PNG'
    bpy.context.scene.render.resolution_x = 800
    bpy.context.scene.render.resolution_y = 600
    bpy.context.scene.cycles.samples = 64
    
    # Render
    bpy.ops.render.render(write_still=True)

def export_glb(output_path, product_data):
    """Export the product as GLB file"""
    clear_scene()
    
    # Create product mesh
    obj = create_product_mesh(product_data['dimensions'], product_data['category'])
    
    # Setup materials
    setup_materials(obj, product_data['category'], product_data['annotations']['materials'])
    
    # Export as GLB
    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format='GLB',
        use_selection=False,
        export_materials='EXPORT'
    )

def main():
    """Main function to process command line arguments"""
    if len(sys.argv) < 7:
        print("Usage: blender --background --python script.py -- <product_json> <output_dir> <action> [view_type]")
        sys.exit(1)
    
    # Parse arguments
    product_json_path = sys.argv[sys.argv.index('--') + 1]
    output_dir = sys.argv[sys.argv.index('--') + 2]
    action = sys.argv[sys.argv.index('--') + 3]
    
    # Load product data
    with open(product_json_path, 'r') as f:
        product_data = json.load(f)
    
    if action == 'render':
        view_type = sys.argv[sys.argv.index('--') + 4]
        output_path = os.path.join(output_dir, f'render_{view_type}.png')
        render_view(output_path, view_type, product_data)
    elif action == 'export_glb':
        output_path = os.path.join(output_dir, 'model.glb')
        export_glb(output_path, product_data)

if __name__ == "__main__":
    main()
`

    await fs.writeFile(path.join(this.scriptsDir, "product_renderer.py"), renderScript)
  }

  async renderProduct(product, outputDir) {
    try {
      // Create temporary product data file
      const tempDataPath = path.join(outputDir, "temp_product_data.json")
      await fs.writeFile(tempDataPath, JSON.stringify(product, null, 2))

      const scriptPath = path.join(this.scriptsDir, "product_renderer.py")

      // Generate GLB model
      await this.executeBlenderScript(scriptPath, tempDataPath, outputDir, "export_glb")

      // Generate renders
      const views = ["front", "side", "top"]
      for (const view of views) {
        await this.executeBlenderScript(scriptPath, tempDataPath, outputDir, "render", view)
      }

      // Clean up temp file
      await fs.unlink(tempDataPath)

      return {
        glb: path.join(outputDir, "model.glb"),
        renders: {
          front: path.join(outputDir, "render_front.png"),
          side: path.join(outputDir, "render_side.png"),
          top: path.join(outputDir, "render_top.png"),
        },
      }
    } catch (error) {
      console.error("Blender rendering error:", error)
      throw error
    }
  }

  async executeBlenderScript(scriptPath, productDataPath, outputDir, action, viewType = null) {
    const args = [productDataPath, outputDir, action]
    if (viewType) args.push(viewType)

    const command = `${this.blenderPath} --background --python ${scriptPath} -- ${args.join(" ")}`

    try {
      const { stdout, stderr } = await execAsync(command, { timeout: 60000 })
      if (stderr && !stderr.includes("Warning")) {
        console.warn("Blender warning:", stderr)
      }
      return stdout
    } catch (error) {
      console.error("Blender execution error:", error)
      throw new Error(`Blender rendering failed: ${error.message}`)
    }
  }

  async isBlenderAvailable() {
    try {
      await execAsync(`${this.blenderPath} --version`)
      return true
    } catch {
      return false
    }
  }
}

module.exports = new BlenderRenderer()
