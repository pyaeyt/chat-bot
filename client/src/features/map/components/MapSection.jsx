import Image from 'next/image'

export default function MapSection() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-2 dark:text-white">Campus Map</h2>
      
      <p className="text-neutral-500 mb-4 text-sm lg:text-base">
        Explore the university campus using the map below. You can locate buildings, 
        classrooms, and important facilities.
      </p>

      <div className="flex justify-center">
        <Image
          src="/rsu_map.jpg"
          alt="Campus Map"
          width={900}
          height={600}
          className="rounded-xl shadow-md w-full h-auto"
        />
      </div>

      
    </div>
  )
}