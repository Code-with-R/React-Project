import React from 'react'

export default function About() {
    return (
        <div className="py-16 bg-white">
            <div className="container m-auto px-6 text-gray-600 md:px-12 xl:px-6">
                <div className="space-y-6 md:space-y-0 md:flex md:gap-6 lg:items-center lg:gap-12">
                    <div className="md:5/12 lg:w-5/12">
                        <img
                            src="data:image/jpeg;base64,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"
                            alt="image"
                        />
                    </div>
                    <div className="md:7/12 lg:w-6/12">
                        <h2 className="text-2xl text-gray-900 font-bold md:text-4xl">
                            React development is carried out by passionate developers
                        </h2>
                        <p className="mt-6 text-gray-600">
                            Lorem ipsum dolor, sit amet consectetur adipisicing elit. Eum omnis voluptatem
                            accusantium nemo perspiciatis delectus atque autem! Voluptatum tenetur beatae unde
                            aperiam, repellat expedita consequatur! Officiis id consequatur atque doloremque!
                        </p>
                        <p className="mt-4 text-gray-600">
                            Nobis minus voluptatibus pariatur dignissimos libero quaerat iure expedita at?
                            Asperiores nemo possimus nesciunt dicta veniam aspernatur quam mollitia.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}