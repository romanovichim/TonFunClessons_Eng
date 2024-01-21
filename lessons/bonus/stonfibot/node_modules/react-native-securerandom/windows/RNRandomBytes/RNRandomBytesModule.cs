using ReactNative.Bridge;
using System;
using System.Collections.Generic;
using Windows.ApplicationModel.Core;
using Windows.UI.Core;

namespace Net.Rhogan.RNSecureRandom
{
    /// <summary>
    /// A module that allows JS to share data.
    /// </summary>
    class RNSecureRandomModule : NativeModuleBase
    {
        /// <summary>
        /// Instantiates the <see cref="RNSecureRandomModule"/>.
        /// </summary>
        internal RNSecureRandomModule()
        {

        }

        /// <summary>
        /// The name of the native module.
        /// </summary>
        public override string Name
        {
            get
            {
                return "RNSecureRandom";
            }
        }
    }
}
