const userRepository = require('../../app/repository/user-repository')



describe('User repository', () => {
    it('should returns nearby drivers by location', async () => {
        let lat=-5.03280144;
        let lng=-42.8150323;
        let driversFound = await userRepository.findDriversInsideArea(lat,lng,25)
        console.log(driversFound)
        const confirm = driversFound ? true : false;
        expect(confirm).toBe(true)

    })
}); 